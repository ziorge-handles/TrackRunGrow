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

  const fees = await prisma.teamFee.findMany({
    where: { teamId },
    include: {
      payments: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalAthletes = await prisma.athleteTeam.count({ where: { teamId, leftAt: null } })

  const enriched = fees.map((fee) => ({
    ...fee,
    totalAthletes,
    paidCount: fee.payments.filter((p) => p.status === 'PAID').length,
    pendingCount: fee.payments.filter((p) => p.status === 'PENDING').length,
    overdueCount: fee.payments.filter((p) => p.status === 'OVERDUE').length,
    waivedCount: fee.payments.filter((p) => p.status === 'WAIVED').length,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { teamId?: string; name?: string; amount?: number; dueDate?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { teamId, name, amount, dueDate, description } = body
  if (!teamId || !name || amount === undefined) {
    return NextResponse.json({ error: 'teamId, name, and amount are required' }, { status: 400 })
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coach: { userId: session.user.id } } } },
      ],
    },
    include: { athletes: { where: { leftAt: null }, select: { athleteId: true } } },
  })
  if (!team) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const fee = await prisma.teamFee.create({
    data: {
      teamId,
      name,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      description: description ?? null,
      createdById: session.user.id,
      // Auto-create PENDING payment records for all team athletes
      payments: {
        create: team.athletes.map((at) => ({
          athleteId: at.athleteId,
          status: 'PENDING',
        })),
      },
    },
  })

  return NextResponse.json(fee, { status: 201 })
}
