import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Only coaches can moderate reviews' }, { status: 403 })
  }

  let body: { reviewId?: string; action?: 'approve' | 'reject' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { reviewId, action } = body
  if (!reviewId || !action) {
    return NextResponse.json({ error: 'reviewId and action are required' }, { status: 400 })
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
