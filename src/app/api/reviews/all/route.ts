import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.role !== 'COACH') {
    return NextResponse.json({ error: 'Only coaches can view all reviews' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

  const reviews = await prisma.review.findMany({
    orderBy: { submittedAt: 'desc' },
    skip: page * limit,
    take: limit,
  })

  return NextResponse.json(reviews)
}
