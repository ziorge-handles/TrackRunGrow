import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function handleModeration(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.role !== 'COACH' && session.user.role !== 'ADMIN' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only coaches and admins can moderate reviews' }, { status: 403 })
  }

  let body: { reviewId?: string; action?: 'approve' | 'reject'; status?: 'APPROVED' | 'REJECTED' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { reviewId } = body
  // Support both "action" (legacy) and "status" (new admin panel) formats
  const action = body.action ?? (body.status === 'APPROVED' ? 'approve' : body.status === 'REJECTED' ? 'reject' : undefined)

  if (!reviewId || !action) {
    return NextResponse.json({ error: 'reviewId and action/status are required' }, { status: 400 })
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 })
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      ...(action === 'approve' ? { approvedAt: new Date(), approvedBy: session.user.id } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleModeration(request)
}

export async function PATCH(request: Request): Promise<NextResponse> {
  return handleModeration(request)
}
