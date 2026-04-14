/**
 * Server-only diagnostics for Vercel/host logs.
 * Set TRG_SERVER_DEBUG=1 to enable verbose `[trg]` info logs in production.
 */

function truthyEnv(v: string | undefined): boolean {
  return v === '1' || v?.toLowerCase() === 'true'
}

export function isVerboseServerDebug(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return truthyEnv(process.env.TRG_SERVER_DEBUG)
}

/** Verbose breadcrumbs — development always; production only if TRG_SERVER_DEBUG=1 */
export function serverDebug(scope: string, payload: Record<string, unknown>): void {
  if (!isVerboseServerDebug()) return
  console.log(`[trg:${scope}]`, JSON.stringify(payload))
}

type ErrorWithDigest = Error & { digest?: string }

/**
 * Structured error for host logs (message, stack, Next digest). Does not include secrets.
 * Call from Server Components / route handlers before rethrowing.
 */
export function logServerError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const base = { scope, ...context }
  if (error instanceof Error) {
    const d = error as ErrorWithDigest
    console.error('[trg:error]', {
      ...base,
      name: d.name,
      message: d.message,
      stack: d.stack,
      digest: d.digest,
    })
    return
  }
  console.error('[trg:error]', { ...base, error })
}
