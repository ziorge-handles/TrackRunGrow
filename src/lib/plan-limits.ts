import { prisma } from '@/lib/prisma'

export const PLAN_LIMITS = {
  BASIC: { maxTeams: 1, maxAthletesPerTeam: 25, aiSuggestions: false, advancedAnalytics: false, coachInvitations: false, meetLineups: false, importExport: false },
  PRO: { maxTeams: 999, maxAthletesPerTeam: 999, aiSuggestions: true, advancedAnalytics: true, coachInvitations: true, meetLineups: true, importExport: true },
  ENTERPRISE: { maxTeams: 999, maxAthletesPerTeam: 999, aiSuggestions: true, advancedAnalytics: true, coachInvitations: true, meetLineups: true, importExport: true },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  return (sub?.plan as PlanKey) ?? 'BASIC'
}

export async function checkTeamLimit(userId: string): Promise<{ allowed: boolean; current: number; max: number; plan: PlanKey }> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  const teamCount = await prisma.team.count({ where: { ownerId: userId } })
  return { allowed: teamCount < limits.maxTeams, current: teamCount, max: limits.maxTeams, plan }
}

export async function checkAthleteLimit(userId: string, teamId: string): Promise<{ allowed: boolean; current: number; max: number; plan: PlanKey }> {
  const plan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[plan]
  const athleteCount = await prisma.athleteTeam.count({ where: { teamId } })
  return { allowed: athleteCount < limits.maxAthletesPerTeam, current: athleteCount, max: limits.maxAthletesPerTeam, plan }
}

export async function checkFeatureAccess(userId: string, feature: keyof typeof PLAN_LIMITS.BASIC): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return PLAN_LIMITS[plan][feature] as boolean
}
