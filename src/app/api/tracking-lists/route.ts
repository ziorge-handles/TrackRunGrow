import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 })

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

  const lists = await prisma.trackingList.findMany({
    where: { teamId },
    include: {
      items: {
        include: {
          athlete: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: page * limit,
    take: limit,
  })

  return NextResponse.json(lists)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { teamId?: string; name?: string; description?: string; athleteIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { teamId, name, description, athleteIds } = body
  if (!teamId || !name) return NextResponse.json({ error: 'teamId and name are required' }, { status: 400 })

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

  let validAthleteIds: string[] = []
  if (athleteIds?.length) {
    const teamAthletes = await prisma.athleteTeam.findMany({
      where: { teamId, athleteId: { in: athleteIds }, leftAt: null },
      select: { athleteId: true },
    })
    validAthleteIds = teamAthletes.map((a) => a.athleteId)
  }

  const list = await prisma.trackingList.create({
    data: {
      teamId,
      name,
      description: description ?? null,
      createdById: session.user.id,
      ...(validAthleteIds.length
        ? {
            items: {
              create: validAthleteIds.map((athleteId) => ({
                athleteId,
                addedById: session.user.id,
              })),
            },
          }
        : {}),
    },
    include: { items: true },
  })

  return NextResponse.json(list, { status: 201 })
}
