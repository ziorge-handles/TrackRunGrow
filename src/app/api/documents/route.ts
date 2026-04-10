import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DocumentType } from '@/generated/prisma/client'

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  const athleteId = searchParams.get('athleteId')
  const type = searchParams.get('type') as DocumentType | null

  if (!teamId && !athleteId) {
    return NextResponse.json({ error: 'teamId or athleteId is required' }, { status: 400 })
  }

  // Verify team access if teamId provided
  if (teamId) {
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
  }

  const docs = await prisma.document.findMany({
    where: {
      ...(teamId ? { teamId } : {}),
      ...(athleteId ? { athleteId } : {}),
      ...(type ? { type } : {}),
    },
    include: {
      athlete: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const uploaderIds = [...new Set(docs.map((d) => d.uploadedById))]
  const uploaders = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true },
  })
  const uploaderMap = Object.fromEntries(uploaders.map((u) => [u.id, u]))

  const enriched = docs.map((d) => ({ ...d, uploader: uploaderMap[d.uploadedById] ?? null }))
  return NextResponse.json(enriched)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    teamId?: string
    athleteId?: string
    name?: string
    type?: DocumentType
    fileUrl?: string
    fileSize?: number
    mimeType?: string
    description?: string
    isPublic?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { teamId, athleteId, name, type, fileUrl, fileSize, mimeType, description, isPublic } = body
  if (!name || !type || !fileUrl) {
    return NextResponse.json({ error: 'name, type, and fileUrl are required' }, { status: 400 })
  }

  // Verify access
  if (teamId) {
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
  }

  const doc = await prisma.document.create({
    data: {
      teamId: teamId ?? null,
      athleteId: athleteId ?? null,
      uploadedById: session.user.id,
      name,
      type,
      fileUrl,
      fileSize: fileSize ?? null,
      mimeType: mimeType ?? null,
      description: description ?? null,
      isPublic: isPublic ?? false,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
