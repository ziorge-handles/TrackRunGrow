import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  const reviews = await prisma.review.findMany({
    where: { status: 'APPROVED' },
    orderBy: { submittedAt: 'desc' },
  })
  return NextResponse.json(reviews)
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: {
    authorName?: string
    authorRole?: string
    authorOrg?: string
    rating?: number
    title?: string
    body?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { authorName, authorRole, rating, title, body: reviewBody, authorOrg } = body

  if (!authorName || !authorRole || !rating || !title || !reviewBody) {
    return NextResponse.json({ error: 'authorName, authorRole, rating, title, and body are required' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 })
  }

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
