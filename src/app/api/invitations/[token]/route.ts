import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: {
      team: {
        include: { school: true },
      },
    },
  })

  if (!invitation) {
    return Response.json({ error: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.status !== 'PENDING') {
    return Response.json({ error: `Invitation is ${invitation.status.toLowerCase()}` }, { status: 410 })
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({
      where: { token },
      data: { status: 'EXPIRED' },
    })
    return Response.json({ error: 'Invitation has expired' }, { status: 410 })
  }

  // Get inviter name
  const inviter = await prisma.user.findUnique({
    where: { id: invitation.createdById },
    select: { name: true },
  })

  return Response.json({
    teamName: invitation.team.name,
    teamSchool: invitation.team.school.name,
    inviterName: inviter?.name ?? 'Your coach',
    coachRole: invitation.coachRole,
    invitedEmail: invitation.invitedEmail,
    expiresAt: invitation.expiresAt,
  })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { token } = await params

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  })

  if (!invitation) {
    return Response.json({ error: 'Invitation not found' }, { status: 404 })
  }

  if (invitation.status !== 'PENDING') {
    return Response.json({ error: `Invitation is ${invitation.status.toLowerCase()}` }, { status: 410 })
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({
      where: { token },
      data: { status: 'EXPIRED' },
    })
    return Response.json({ error: 'Invitation has expired' }, { status: 410 })
  }

  if (session.user.email?.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
    return Response.json({ error: 'This invitation was sent to a different email address' }, { status: 403 })
  }

  // Get or create coach profile
  let coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) {
    coach = await prisma.coach.create({ data: { userId: session.user.id } })

    // Update user role to COACH if needed
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'COACH' },
    })
  }

  // Check if already a member of this team
  const existing = await prisma.coachTeam.findUnique({
    where: { coachId_teamId: { coachId: coach.id, teamId: invitation.teamId } },
  })

  if (!existing) {
    await prisma.coachTeam.create({
      data: {
        coachId: coach.id,
        teamId: invitation.teamId,
        coachRole: invitation.coachRole,
        isPrimary: false,
      },
    })
  }

  await prisma.teamInvitation.update({
    where: { token },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
  })

  return Response.json({ success: true, teamId: invitation.teamId })
}
