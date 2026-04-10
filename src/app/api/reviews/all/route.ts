import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Only coaches can view all reviews' }, { status: 403 })
  }

  const reviews = await prisma.review.findMany({
    orderBy: { submittedAt: 'desc' },
  })

  return NextResponse.json(reviews)
}
