import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function verifyEventAccess(eventId: string, userId: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } })
  if (!event) return null

  if (event.createdById === userId) return event

  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach || !event.teamId) return null

  const team = await prisma.team.findFirst({
    where: {
      id: event.teamId,
      OR: [
        { ownerId: userId },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
  })

  return team ? event : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await params
  const event = await verifyEventAccess(eventId, session.user.id)
  if (!event) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  const body = await request.json() as {
    title?: string
    startTime?: string
    endTime?: string
    allDay?: boolean
    location?: string
    description?: string
    color?: string
  }

  const updated = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
      ...(body.endTime !== undefined && { endTime: new Date(body.endTime) }),
      ...(body.allDay !== undefined && { allDay: body.allDay }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.color !== undefined && { color: body.color }),
    },
  })

  return Response.json({ event: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await params
  const event = await verifyEventAccess(eventId, session.user.id)
  if (!event) return Response.json({ error: 'Not found or forbidden' }, { status: 404 })

  await prisma.calendarEvent.delete({ where: { id: eventId } })

  return Response.json({ success: true })
}
