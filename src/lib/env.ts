/**
 * Validates critical environment variables at startup.
 * Import this module early (e.g. in auth.ts or layout.tsx) so missing
 * configuration surfaces immediately rather than at the first user request.
 */

const isProduction = process.env.NODE_ENV === 'production'

function requireEnv(name: string, hint?: string): string {
  const value = process.env[name]
  if (!value) {
    const msg = `Missing required environment variable: ${name}.${hint ? ' ' + hint : ''}`
    if (isProduction) {
      throw new Error(msg)
    }
    console.warn(`[env] ${msg}`)
    return ''
  }
  return value
}

function warnEnv(name: string, hint?: string): void {
  if (!process.env[name]) {
    console.warn(`[env] ${name} is not set.${hint ? ' ' + hint : ''}`)
  }
}

function requirePublicAppUrl(): void {
  const fromEnv =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL === '1' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : '')
  if (!fromEnv) {
    const msg =
      'Missing public app URL in production. Set AUTH_URL or NEXTAUTH_URL to your site origin (e.g. https://www.trackrungrow.com). On Vercel, VERCEL_URL is used only as a fallback when those are unset.'
    if (isProduction) {
      throw new Error(msg)
    }
    console.warn(`[env] ${msg}`)
  }
}

export function validateEnv(): void {
  requireEnv('DATABASE_URL', 'See .env.example for the connection string format.')
  requireEnv('AUTH_SECRET', 'Run: openssl rand -base64 32')

  if (isProduction) {
    requirePublicAppUrl()
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim() && !process.env.STRIPE_SECRET?.trim()) {
    console.warn(
      '[env] STRIPE_SECRET_KEY or STRIPE_SECRET is not set. Stripe checkout will not work without one of these.',
    )
  }
  warnEnv('SENDGRID_API_KEY', 'Email sending (verification, contact form) will not work without this.')
}

// Run on first import
validateEnv()
