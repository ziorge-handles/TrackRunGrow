import { prisma } from '@/lib/prisma'
import AdminUserList from './AdminUserList'

async function getUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })
  } catch {
    return []
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
        <p className="text-gray-500 mt-1">View and manage all user accounts</p>
      </div>
      <AdminUserList initialUsers={users} />
    </div>
  )
}
