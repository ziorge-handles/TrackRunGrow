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

  const reports = await prisma.trainerReport.findMany({
    where: { teamId },
    orderBy: { reportDate: 'desc' },
  })

  const authorIds = [...new Set(reports.map((r) => r.authorId))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  })
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]))

  return NextResponse.json(reports.map((r) => ({ ...r, author: authorMap[r.authorId] ?? null })))
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { teamId?: string; title?: string; reportDate?: string; content?: string; athleteIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { teamId, title, reportDate, content, athleteIds } = body
  if (!teamId || !title || !reportDate || !content) {
    return NextResponse.json({ error: 'teamId, title, reportDate, and content are required' }, { status: 400 })
  }

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

  const report = await prisma.trainerReport.create({
    data: {
      teamId,
      authorId: session.user.id,
      title,
      reportDate: new Date(reportDate),
      content,
      athleteIds: athleteIds ?? [],
    },
  })

  return NextResponse.json(report, { status: 201 })
}
