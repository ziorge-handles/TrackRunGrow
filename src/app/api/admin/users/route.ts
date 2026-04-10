import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { BCRYPT_ROUNDS } from '@/lib/constants'

export async function GET(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  return NextResponse.json(users)
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let body: {
    name?: string
    email?: string
    role?: string
    password?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, role, password } = body

  if (!name || !email || !role || !password) {
    return NextResponse.json(
      { error: 'name, email, role, and password are required' },
      { status: 400 },
    )
  }

  if (!['COACH', 'ATHLETE', 'ADMIN'].includes(role)) {
    return NextResponse.json(
      { error: 'role must be COACH, ATHLETE, or ADMIN' },
      { status: 400 },
    )
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'A user with this email already exists' },
      { status: 409 },
    )
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: role as 'COACH' | 'ATHLETE' | 'ADMIN',
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
