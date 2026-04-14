import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('rateLimit (memory fallback)', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.resetModules()
  })

  it('allows up to maxAttempts then rejects', async () => {
    const { rateLimit } = await import('./rate-limit')
    expect((await rateLimit('key-a', 2, 60_000)).success).toBe(true)
    expect((await rateLimit('key-a', 2, 60_000)).success).toBe(true)
    expect((await rateLimit('key-a', 2, 60_000)).success).toBe(false)
  })

  it('uses separate buckets per key', async () => {
    const { rateLimit } = await import('./rate-limit')
    expect((await rateLimit('key-b', 1, 60_000)).success).toBe(true)
    expect((await rateLimit('key-c', 1, 60_000)).success).toBe(true)
  })
})
