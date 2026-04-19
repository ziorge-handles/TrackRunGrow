import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '@/lib/constants'
import { formatDate, formatPace, formatTime } from '@/lib/utils'

interface PageProps {
  params: Promise<{ athleteId: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function AthleteWorkoutsPage({ params, searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { athleteId } = await params
  const { type } = await searchParams

  // Access check
  if ((session.user.role === 'COACH' || session.user.role === 'ADMIN')) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) notFound()
    const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, include: { teams: true } })
    if (!athlete) notFound()
    const teamIds = athlete.teams.map((at) => at.teamId)
    const hasAccess = await prisma.team.findFirst({
      where: { id: { in: teamIds }, OR: [{ ownerId: session.user.id }, { coaches: { some: { coachId: coach.id } } }] },
    })
    if (!hasAccess) notFound()
  } else {
    const ownAthlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } })
    if (!ownAthlete || ownAthlete.id !== athleteId) notFound()
  }

  const workouts = await prisma.workoutLog.findMany({
    where: {
      athleteId,
      ...(type ? { type: type as 'EASY_RUN' | 'TEMPO' | 'INTERVAL' | 'LONG_RUN' | 'RECOVERY' | 'STRENGTH' | 'CROSS_TRAINING' | 'RACE' | 'REST' | 'CUSTOM' } : {}),
    },
    include: { intervals: true },
    orderBy: { date: 'desc' },
  })

  const workoutTypes = Object.keys(WORKOUT_TYPE_LABELS) as Array<keyof typeof WORKOUT_TYPE_LABELS>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Workout History</h2>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="?"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!type ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All
        </a>
        {workoutTypes.map((t) => (
          <a
            key={t}
            href={`?type=${t}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${type === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {WORKOUT_TYPE_LABELS[t]}
          </a>
        ))}
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No workouts found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={WORKOUT_TYPE_COLORS[workout.type]}>
                        {WORKOUT_TYPE_LABELS[workout.type]}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(workout.date)}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{workout.title}</h3>
                    {workout.description && (
                      <p className="text-sm text-gray-500 mt-1">{workout.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      {workout.distanceMiles != null && (
                        <span>{workout.distanceMiles} mi</span>
                      )}
                      {workout.durationMin != null && (
                        <span>{formatTime(workout.durationMin * 60)}</span>
                      )}
                      {workout.avgPaceSecPerMile != null && (
                        <span>{formatPace(workout.avgPaceSecPerMile)}</span>
                      )}
                      {workout.avgHR != null && (
                        <span>{workout.avgHR} bpm avg</span>
                      )}
                      {workout.perceivedEffort != null && (
                        <span className="flex items-center gap-1">
                          RPE <span className="font-semibold">{workout.perceivedEffort}/10</span>
                        </span>
                      )}
                    </div>

                    {workout.notes && (
                      <p className="text-sm text-gray-400 mt-2 italic">{workout.notes}</p>
                    )}
                  </div>

                  {workout.intervals.length > 0 && (
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {workout.intervals.length} intervals
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
