import { TOTP, Secret } from 'otpauth'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

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
  for (let i = 0; i < 8; i++) {
    // 8 random alphanumeric characters (uppercase)
    const code = randomBytes(6)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8)
      .padEnd(8, '0')
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
