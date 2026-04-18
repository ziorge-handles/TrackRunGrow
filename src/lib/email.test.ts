import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
  vi.restoreAllMocks()
})

describe('sendVerificationEmail', () => {
  it('calls sgMail.send when SENDGRID_API_KEY is set', async () => {
    process.env.SENDGRID_API_KEY = 'SG.fake-key'
    const sendMock = vi.fn().mockResolvedValue([{ statusCode: 202 }])
    vi.doMock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: sendMock } }))

    const { sendVerificationEmail } = await import('./email')
    await sendVerificationEmail({ to: 'coach@school.edu', verifyUrl: 'https://app.com/verify' })

    expect(sendMock).toHaveBeenCalledOnce()
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'coach@school.edu', subject: expect.stringContaining('Verify') }),
    )
  })

  it('skips sending and warns when SENDGRID_API_KEY is absent', async () => {
    delete process.env.SENDGRID_API_KEY
    const sendMock = vi.fn()
    vi.doMock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: sendMock } }))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { sendVerificationEmail } = await import('./email')
    await sendVerificationEmail({ to: 'a@b.com', verifyUrl: 'https://example.com/v' })

    expect(sendMock).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('SENDGRID_API_KEY'))
  })
})

describe('sendPasswordResetEmail', () => {
  it('logs console.error in production when SENDGRID_API_KEY is absent', async () => {
    delete process.env.SENDGRID_API_KEY
    process.env.NODE_ENV = 'production'
    const sendMock = vi.fn()
    vi.doMock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: sendMock } }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { sendPasswordResetEmail } = await import('./email')
    await sendPasswordResetEmail({ to: 'user@example.com', resetUrl: 'https://app.com/reset' })

    expect(sendMock).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('sendPasswordResetEmail'))
  })

  it('calls sgMail.send with correct subject', async () => {
    process.env.SENDGRID_API_KEY = 'SG.fake-key'
    const sendMock = vi.fn().mockResolvedValue([{ statusCode: 202 }])
    vi.doMock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: sendMock } }))

    const { sendPasswordResetEmail } = await import('./email')
    await sendPasswordResetEmail({ to: 'user@example.com', resetUrl: 'https://app.com/reset/abc' })

    expect(sendMock).toHaveBeenCalledOnce()
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('Reset') }),
    )
  })
})

describe('sendWelcomeEmail', () => {
  it('sends welcome email with personalized content', async () => {
    process.env.SENDGRID_API_KEY = 'SG.fake-key'
    const sendMock = vi.fn().mockResolvedValue([{ statusCode: 202 }])
    vi.doMock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: sendMock } }))

    const { sendWelcomeEmail } = await import('./email')
    await sendWelcomeEmail({ to: 'new@coach.edu', name: 'Coach Smith' })

    expect(sendMock).toHaveBeenCalledOnce()
    const callArg = sendMock.mock.calls[0][0] as { html: string; to: string }
    expect(callArg.html).toContain('Coach Smith')
    expect(callArg.to).toBe('new@coach.edu')
  })
})

describe('sendMfaCode', () => {
  it('does not send in dev when key is missing (no error log)', async () => {
    delete process.env.SENDGRID_API_KEY
    process.env.NODE_ENV = 'development'
    const sendMock = vi.fn()
    vi.doMock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: sendMock } }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { sendMfaCode } = await import('./email')
    await sendMfaCode({ to: 'user@example.com', code: '123456' })

    expect(sendMock).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
