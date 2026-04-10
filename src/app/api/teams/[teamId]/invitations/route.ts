import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTeamInvitation } from '@/lib/email'
import type { CoachRole } from '@/generated/prisma/client'

async function verifyHeadCoachAccess(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      coaches: {
        include: { coach: true },
      },
    },
  })

  if (!team) return null

  const isOwner = team.ownerId === userId
  if (isOwner) return team

  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return null

  const coachTeam = team.coaches.find((ct) => ct.coachId === coach.id)
  if (!coachTeam || coachTeam.coachRole !== 'HEAD_COACH') return null

  return team
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId } = await params
  const team = await verifyHeadCoachAccess(teamId, session.user.id)
  if (!team) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invitations = await prisma.teamInvitation.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ invitations })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId } = await params
  const team = await verifyHeadCoachAccess(teamId, session.user.id)
  if (!team) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    invitedEmail: string
    coachRole: CoachRole
  }

  const { invitedEmail, coachRole } = body

  if (!invitedEmail || !coachRole) {
    return Response.json({ error: 'invitedEmail and coachRole are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(invitedEmail)) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (!['HEAD_COACH', 'ASSISTANT_COACH', 'VOLUNTEER'].includes(coachRole)) {
    return Response.json({ error: 'Invalid coach role' }, { status: 400 })
  }

  // Check for existing pending invitation
  const existing = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      invitedEmail,
      status: 'PENDING',
    },
  })

  if (existing) {
    return Response.json({ error: 'An invitation is already pending for this email' }, { status: 409 })
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId,
      invitedEmail,
      coachRole,
      expiresAt,
      createdById: session.user.id,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const inviteUrl = `${baseUrl}/accept-invitation?token=${invitation.token}`

  try {
    await sendTeamInvitation({
      to: invitedEmail,
      teamName: team.name,
      inviterName: session.user.name ?? 'Your coach',
      inviteUrl,
    })
  } catch (err) {
    console.error('Failed to send invitation email:', err)
    // Don't fail the request if email fails — invitation is created
  }

  return Response.json({ invitation }, { status: 201 })
}
