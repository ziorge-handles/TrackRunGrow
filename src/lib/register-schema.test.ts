import { describe, it, expect } from 'vitest'
import { registerPasswordSchema, registerSchema } from './register-schema'

describe('registerPasswordSchema', () => {
  it('accepts a strong password', () => {
    expect(registerPasswordSchema.safeParse('GoodPass1').success).toBe(true)
  })

  it('rejects short password', () => {
    const r = registerPasswordSchema.safeParse('Ab1')
    expect(r.success).toBe(false)
  })

  it('requires mixed case and digit', () => {
    expect(registerPasswordSchema.safeParse('alllower1').success).toBe(false)
    expect(registerPasswordSchema.safeParse('ALLUPPER1').success).toBe(false)
    expect(registerPasswordSchema.safeParse('NoDigitAa').success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('requires stripeSessionId or inviteToken', () => {
    const r = registerSchema.safeParse({
      name: 'Coach Name',
      password: 'GoodPass1',
    })
    expect(r.success).toBe(false)
  })

  it('accepts invite flow', () => {
    const r = registerSchema.safeParse({
      name: 'Coach Name',
      password: 'GoodPass1',
      inviteToken: 'a'.repeat(12),
    })
    expect(r.success).toBe(true)
  })

  it('requires checkoutRef when stripeSessionId is set', () => {
    const missingRef = registerSchema.safeParse({
      name: 'Coach Name',
      password: 'GoodPass1',
      stripeSessionId: 'cs_test_abc',
    })
    expect(missingRef.success).toBe(false)

    const ok = registerSchema.safeParse({
      name: 'Coach Name',
      password: 'GoodPass1',
      stripeSessionId: 'cs_test_abc',
      checkoutRef: 'a'.repeat(32),
    })
    expect(ok.success).toBe(true)
  })
})
