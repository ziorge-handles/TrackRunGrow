import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAthleteLimit } from '@/lib/plan-limits'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { BCRYPT_ROUNDS } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const teamId = searchParams.get('teamId')
  const status = searchParams.get('status')

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) return Response.json({ athletes: [] })

  // Determine accessible team IDs
  let accessibleTeamIds: string[]

  if (teamId) {
    // Verify this coach can access the team
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
    })
    if (!team) return Response.json({ error: 'Forbidden' }, { status: 403 })
    accessibleTeamIds = [teamId]
  } else {
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
      select: { id: true },
    })
    accessibleTeamIds = teams.map((t) => t.id)
  }

  const athletes = await prisma.athlete.findMany({
    where: {
      teams: { some: { teamId: { in: accessibleTeamIds } } },
      ...(status ? { status: status as 'ACTIVE' | 'INJURED' | 'INACTIVE' | 'REDSHIRT' } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      teams: {
        include: {
          team: { select: { id: true, name: true, sport: true } },
        },
      },
      bodyMetrics: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json({ athletes })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'COACH') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) return Response.json({ error: 'Coach profile not found' }, { status: 404 })

  const body = await request.json() as {
    name: string
    email: string
    teamId: string
    graduationYear?: number
    jerseyNumber?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
  }

  const { name, email, teamId, graduationYear, jerseyNumber, gender } = body

  if (!name || !email || !teamId) {
    return Response.json({ error: 'name, email, and teamId are required' }, { status: 400 })
  }

  if (name.length > 100) {
    return Response.json({ error: 'Name must not exceed 100 characters' }, { status: 400 })
  }

  if (email.length > 254) {
    return Response.json({ error: 'Email must not exceed 254 characters' }, { status: 400 })
  }

  if (jerseyNumber && jerseyNumber.length > 10) {
    return Response.json({ error: 'Jersey number must not exceed 10 characters' }, { status: 400 })
  }

  if (jerseyNumber && !/^[A-Za-z0-9]*$/.test(jerseyNumber)) {
    return Response.json({ error: 'Jersey number can only contain letters and numbers' }, { status: 400 })
  }

  // Plan enforcement: check athlete limit
  const athleteCheck = await checkAthleteLimit(session.user.id, teamId)
  if (!athleteCheck.allowed) {
    return Response.json({
      error: `Your ${athleteCheck.plan} plan allows ${athleteCheck.max} athletes per team. You currently have ${athleteCheck.current}. Upgrade to Pro for unlimited athletes.`,
      upgrade: true
    }, { status: 403 })
  }

  // Verify coach can access this team
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
  })
  if (!team) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Check if user with this email already exists
  let user = await prisma.user.findUnique({ where: { email } })
  let athlete = user ? await prisma.athlete.findUnique({ where: { userId: user.id } }) : null

  if (!user) {
    // Create user with temporary password
    const tempPassword = randomBytes(16).toString('hex')
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)

    user = await prisma.user.create({
      data: {
        name,
        email,
        role: 'ATHLETE',
        passwordHash,
      },
    })
  }

  if (!athlete) {
    athlete = await prisma.athlete.create({
      data: {
        userId: user.id,
        graduationYear,
        jerseyNumber,
        gender,
        status: 'ACTIVE',
      },
    })
  }

  // Add to team if not already a member
  const existingMembership = await prisma.athleteTeam.findUnique({
    where: { athleteId_teamId: { athleteId: athlete.id, teamId } },
  })

  if (!existingMembership) {
    await prisma.athleteTeam.create({
      data: { athleteId: athlete.id, teamId },
    })
  }

  // Send welcome email
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  try {
    await sendWelcomeEmail({
      to: email,
      name,
    })
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }

  const fullAthlete = await prisma.athlete.findUnique({
    where: { id: athlete.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      teams: { include: { team: true } },
    },
  })

  return Response.json({ athlete: fullAthlete }, { status: 201 })
}
