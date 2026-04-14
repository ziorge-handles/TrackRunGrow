import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let memoryFallbackWarned = false

const memoryMap = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryMap.get(key)

  if (!entry || now > entry.resetAt) {
    memoryMap.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxAttempts - 1 }
  }

  if (entry.count >= maxAttempts) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: maxAttempts - entry.count }
}

const upstashLimiterCache = new Map<string, Ratelimit>()

function getUpstashLimiter(maxAttempts: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  const cacheKey = `${maxAttempts}:${windowSec}`
  let limiter = upstashLimiterCache.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(maxAttempts, `${windowSec} s`),
      prefix: 'trackrungrow:rl',
    })
    upstashLimiterCache.set(cacheKey, limiter)
  }
  return limiter
}

const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryMap) {
    if (now > entry.resetAt) memoryMap.delete(key)
  }
}, 300_000)
if (typeof cleanup.unref === 'function') cleanup.unref()

/**
 * Distributed rate limit when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
 * are set; otherwise in-memory (per server instance only).
 */
export async function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60_000,
): Promise<{ success: boolean; remaining: number }> {
  const upstash = getUpstashLimiter(maxAttempts, windowMs)
  if (upstash) {
    const result = await upstash.limit(key)
    return { success: result.success, remaining: result.remaining }
  }
  if (process.env.NODE_ENV === 'production' && !memoryFallbackWarned) {
    memoryFallbackWarned = true
    console.warn(
      '[rate-limit] Using in-memory fallback. This is per-instance only and ineffective on serverless. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed rate limiting.',
    )
  }
  return memoryRateLimit(key, maxAttempts, windowMs)
}
