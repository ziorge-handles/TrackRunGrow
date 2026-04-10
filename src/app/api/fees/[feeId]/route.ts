import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ feeId: string }>
}

async function getFeeWithAccess(feeId: string, userId: string) {
  const fee = await prisma.teamFee.findUnique({
    where: { id: feeId },
    include: {
      payments: {
        include: {
          athlete: { include: { user: { select: { name: true, email: true } } } },
        },
      },
    },
  })
  if (!fee) return null

  const team = await prisma.team.findFirst({
    where: {
      id: fee.teamId,
      OR: [
        { ownerId: userId },
        { coaches: { some: { coach: { userId } } } },
      ],
    },
  })
  if (!team) return null

  return fee
}

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { feeId } = await params
  const fee = await getFeeWithAccess(feeId, session.user.id)
  if (!fee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(fee)
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { feeId } = await params
  const fee = await getFeeWithAccess(feeId, session.user.id)
  if (!fee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { name?: string; amount?: number; dueDate?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updated = await prisma.teamFee.update({
    where: { id: feeId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.amount !== undefined ? { amount: body.amount } : {}),
      ...(body.dueDate !== undefined ? { dueDate: new Date(body.dueDate) } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    },
  })

  return NextResponse.json(updated)
}
