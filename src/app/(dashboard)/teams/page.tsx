import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trophy, ChevronRight } from 'lucide-react'
import { SPORT_LABELS, SPORT_COLORS } from '@/lib/constants'

async function getTeams(userId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId } })
  if (!coach) return []

  return prisma.team.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    include: {
      school: true,
      _count: {
        select: { athletes: true, coaches: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function TeamsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const teams = await getTeams(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your coaching teams
          </p>
        </div>
        <Link href="/teams/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Team
          </Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first team to start managing athletes and tracking performance.
            </p>
            <Link href="/teams/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create First Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-gray-900 leading-tight">
                      {team.name}
                    </CardTitle>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-sm text-gray-500">{team.school.name}</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={SPORT_COLORS[team.sport]}>
                      {SPORT_LABELS[team.sport]}
                    </Badge>
                    {team.gender && (
                      <Badge variant="outline" className="capitalize">
                        {team.gender.toLowerCase()}
                      </Badge>
                    )}
                    <Badge variant="outline">{team.season}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {team._count.athletes} athletes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      {team._count.coaches} coaches
                    </span>
                  </div>
                  {!team.isActive && (
                    <Badge variant="outline" className="text-gray-400 border-gray-200">
                      Inactive
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
