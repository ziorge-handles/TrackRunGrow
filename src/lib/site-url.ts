/**
 * Public origin for redirects (Stripe checkout, emails).
 * Set AUTH_URL or NEXTAUTH_URL in production (e.g. https://www.trackrungrow.com).
 */
export function getPublicSiteOrigin(): string {
  const raw =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL === '1' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : '') ||
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}
