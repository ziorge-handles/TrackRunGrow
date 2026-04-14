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

export function validateEnv(): void {
  requireEnv('DATABASE_URL', 'See .env.example for the connection string format.')
  requireEnv('AUTH_SECRET', 'Run: openssl rand -base64 32')

  if (isProduction) {
    requireEnv('NEXTAUTH_URL', 'Set to your production URL (e.g. https://trackrungrow.com). Required for OAuth redirects and email links.')
  }

  warnEnv('STRIPE_SECRET_KEY', 'Stripe checkout will not work without this.')
  warnEnv('SENDGRID_API_KEY', 'Email sending (verification, contact form) will not work without this.')
}

// Run on first import
validateEnv()
