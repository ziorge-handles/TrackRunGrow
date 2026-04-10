import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkFeatureAccess } from '@/lib/plan-limits'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const raceId = searchParams.get('raceId')
  const teamId = searchParams.get('teamId')

  if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 })

  // Verify access
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

  const lineups = await prisma.meetLineup.findMany({
    where: { teamId, ...(raceId ? { raceId } : {}) },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: 'desc' },
    skip: page * limit,
    take: limit,
  })

  return NextResponse.json(lineups)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Plan enforcement: check meet lineup feature access
  const hasLineups = await checkFeatureAccess(session.user.id, 'meetLineups')
  if (!hasLineups) {
    return NextResponse.json({ error: 'Meet lineups require a Pro or Enterprise plan. Upgrade to unlock this feature.', upgrade: true }, { status: 403 })
  }

  let body: { name?: string; raceId?: string; teamId?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, raceId, teamId, notes } = body
  if (!name || !raceId || !teamId) {
    return NextResponse.json({ error: 'name, raceId, and teamId are required' }, { status: 400 })
  }

  // Verify access
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const lineup = await prisma.meetLineup.create({
    data: { name, raceId, teamId, createdById: session.user.id, notes: notes ?? null },
  })

  return NextResponse.json(lineup, { status: 201 })
}
