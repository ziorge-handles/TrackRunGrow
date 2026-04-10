import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete user — Prisma cascade deletes all related data
  await prisma.user.delete({ where: { id: session.user.id } })

  return Response.json({ success: true, message: 'Account deleted. All data has been removed.' })
}
