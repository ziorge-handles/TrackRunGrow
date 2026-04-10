import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, Trophy, Star, UserCog } from 'lucide-react'

async function getAdminStats() {
  try {
    const [totalUsers, totalTeams, totalAthletes, pendingReviews] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.athlete.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),
    ])
    return { totalUsers, totalTeams, totalAthletes, pendingReviews }
  } catch {
    return { totalUsers: 0, totalTeams: 0, totalAthletes: 0, pendingReviews: 0 }
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of the TrackRunGrow platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Total Users"
          value={stats.totalUsers}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-emerald-600" />}
          label="Total Teams"
          value={stats.totalTeams}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<UserCog className="w-5 h-5 text-purple-600" />}
          label="Total Athletes"
          value={stats.totalAthletes}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-amber-600" />}
          label="Pending Reviews"
          value={stats.pendingReviews}
          bg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-bold text-gray-900">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">View, create, and manage user accounts</p>
        </Link>
        <Link
          href="/admin/reviews"
          className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-amber-300 hover:shadow-md transition-all"
        >
          <Star className="w-8 h-8 text-amber-600 mb-3" />
          <h3 className="font-bold text-gray-900">Manage Reviews</h3>
          <p className="text-sm text-gray-500 mt-1">Approve or reject pending reviews</p>
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bg}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
