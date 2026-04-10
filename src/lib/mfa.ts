import { TOTP, Secret } from 'otpauth'
import bcrypt from 'bcryptjs'
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto'

const ENCRYPTION_KEY = process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('AUTH_SECRET is required in production') })() : 'dev-fallback-key-not-for-production')

export function encryptSecret(plaintext: string): string {
  const key = scryptSync(ENCRYPTION_KEY, 'trackrungrow-mfa-salt', 32)
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decryptSecret(encryptedData: string): string {
  const key = scryptSync(ENCRYPTION_KEY, 'trackrungrow-mfa-salt', 32)
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

const APP_NAME = 'TrackRunGrow'

export function generateTotpSecret(email: string): { secret: string; uri: string } {
  const secret = new Secret({ size: 20 })

  const totp = new TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  return {
    secret: secret.base32,
    uri: totp.toString(),
  }
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    const totp = new TOTP({
      issuer: APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    })

    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  } catch {
    return false
  }
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    // 128-bit entropy per code using base64url encoding
    const code = randomBytes(8).toString('base64url').slice(0, 10)
    codes.push(code)
  }
  return codes
}

export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code.toUpperCase(), 10)
}

export async function verifyBackupCode(
  code: string,
  hashes: string[],
): Promise<{ valid: boolean; usedIndex: number }> {
  const normalized = code.toUpperCase().trim()

  for (let i = 0; i < hashes.length; i++) {
    const isMatch = await bcrypt.compare(normalized, hashes[i])
    if (isMatch) {
      return { valid: true, usedIndex: i }
    }
  }

  return { valid: false, usedIndex: -1 }
}
