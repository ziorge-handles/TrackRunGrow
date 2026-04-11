import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(): Promise<NextResponse> {
  const reviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { submittedAt: 'desc' },
  })
  return NextResponse.json(reviews)
}

const reviewSchema = z.object({
  authorName: z.string().min(1).max(200),
  authorRole: z.string().min(1).max(200),
  authorOrg: z.string().max(200).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(5000),
})

export async function POST(request: Request): Promise<NextResponse> {
  const forwarded = (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown'
  const { success: rateLimitOk } = rateLimit(`review:${forwarded}`, 3, 3600000)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many reviews submitted. Please try again later.' }, { status: 429 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 })
  }

  const { authorName, authorRole, rating, title, body: reviewBody, authorOrg } = parsed.data

  const review = await prisma.review.create({
    data: {
      authorName,
      authorRole,
      authorOrg: authorOrg ?? null,
      rating,
      title,
      body: reviewBody,
      status: 'PENDING',
    },
  })

  return NextResponse.json(review, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'Missing review id' }, { status: 400 })
  }

  try {
    await prisma.review.delete({ where: { id } })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Review not found' }, { status: 404 })
  }
}
