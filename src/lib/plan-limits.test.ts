import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PLAN_LIMITS, getUserPlan } from './plan-limits'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    team: { count: vi.fn() },
    athleteTeam: { count: vi.fn() },
  },
}))

describe('PLAN_LIMITS', () => {
  it('reserves AI for paid tiers', () => {
    expect(PLAN_LIMITS.BASIC.aiSuggestions).toBe(false)
    expect(PLAN_LIMITS.PRO.aiSuggestions).toBe(true)
    expect(PLAN_LIMITS.ENTERPRISE.aiSuggestions).toBe(true)
  })
})

describe('getUserPlan', () => {
  beforeEach(() => {
    vi.mocked(prisma.subscription.findUnique).mockReset()
    vi.mocked(prisma.subscription.create).mockReset()
  })

  it('returns existing subscription plan', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ plan: 'PRO' } as never)
    await expect(getUserPlan('user-1')).resolves.toBe('PRO')
    expect(prisma.subscription.create).not.toHaveBeenCalled()
  })

  it('creates BASIC subscription when none exists', async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.subscription.create).mockResolvedValue({ plan: 'BASIC' } as never)
    await expect(getUserPlan('user-2')).resolves.toBe('BASIC')
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-2', plan: 'BASIC' }),
      }),
    )
  })
})
