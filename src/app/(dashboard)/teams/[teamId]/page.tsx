import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, Trophy, Crown, User } from 'lucide-react'
import { SPORT_LABELS, SPORT_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import InviteCoachModal from './InviteCoachModal'

interface PageProps {
  params: Promise<{ teamId: string }>
}

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { teamId } = await params

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      school: true,
      coaches: {
        include: {
          coach: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      athletes: {
        include: {
          athlete: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              eventEntries: {
                include: { trackEvent: true },
                where: { isPrimary: true },
              },
            },
          },
        },
      },
    },
  })

  if (!team) notFound()

  // Verify access
  const isOwner = team.ownerId === session.user.id
  if (!isOwner && coach) {
    const isMember = team.coaches.some((ct) => ct.coachId === coach.id)
    if (!isMember) notFound()
  } else if (!isOwner && !coach) {
    notFound()
  }

  const recentRaces = await prisma.race.findMany({
    where: { teamId },
    orderBy: { date: 'desc' },
    take: 5,
    include: { _count: { select: { results: true } } },
  })

  const canManage = isOwner || (coach && team.coaches.find((ct) => ct.coachId === coach.id)?.coachRole === 'HEAD_COACH')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/teams">
            <Button variant="ghost" size="sm" className="mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-sm text-gray-500">
              {team.school.name}{team.school.city ? ` · ${team.school.city}` : ''}
              {team.school.state ? `, ${team.school.state}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={SPORT_COLORS[team.sport]}>{SPORT_LABELS[team.sport]}</Badge>
              {team.gender && (
                <Badge variant="outline" className="capitalize">
                  {team.gender.toLowerCase()}
                </Badge>
              )}
              <Badge variant="outline">{team.season}</Badge>
              {!team.isActive && <Badge variant="outline" className="text-gray-400">Inactive</Badge>}
            </div>
          </div>
        </div>

        {canManage && <InviteCoachModal teamId={teamId} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Athletes Roster */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Athletes ({team.athletes.length})
              </CardTitle>
              <Link href={`/athletes?teamId=${teamId}`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {team.athletes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No athletes on this team yet.
                </p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {team.athletes.map(({ athlete }) => (
                    <Link
                      key={athlete.id}
                      href={`/athletes/${athlete.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                          {athlete.user.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{athlete.user.name}</p>
                          <p className="text-xs text-gray-400">
                            {athlete.eventEntries.map((ae) => ae.trackEvent.name).join(', ') || 'No events'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {athlete.jerseyNumber && (
                          <span className="text-xs text-gray-400">#{athlete.jerseyNumber}</span>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            athlete.status === 'ACTIVE' ? 'text-green-600 border-green-200' :
                            athlete.status === 'INJURED' ? 'text-red-600 border-red-200' :
                            'text-gray-400 border-gray-200'
                          }
                        >
                          {athlete.status.toLowerCase()}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Races */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                Recent Races
              </CardTitle>
              <Link href={`/races?teamId=${teamId}`}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentRaces.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No races yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentRaces.map((race) => (
                    <Link
                      key={race.id}
                      href={`/races/${race.id}`}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{race.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(race.date)} · {race._count.results} results
                        </p>
                      </div>
                      {race.location && (
                        <p className="text-xs text-gray-400">{race.location}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coaches Panel */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                Coaching Staff ({team.coaches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.coaches.map(({ coach: c, coachRole, isPrimary }) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700">
                        {c.user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.user.name}</p>
                        <p className="text-xs text-gray-400">
                          {coachRole.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(isPrimary || c.user.id === session.user.id) && (
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
