import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '@/lib/constants'
import { formatDate, formatPace, formatTime } from '@/lib/utils'

export default async function AthletePortalWorkoutsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } })
  if (!athlete) notFound()

  const workouts = await prisma.workoutLog.findMany({
    where: { athleteId: athlete.id },
    include: { intervals: true },
    orderBy: { date: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">My Workouts</h2>
        <span className="text-sm text-gray-400">({workouts.length})</span>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No workouts logged yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardContent className="py-4">
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
                      {workout.distanceMiles != null && <span>{workout.distanceMiles} mi</span>}
                      {workout.durationMin != null && <span>{formatTime(workout.durationMin * 60)}</span>}
                      {workout.avgPaceSecPerMile != null && <span>{formatPace(workout.avgPaceSecPerMile)}</span>}
                      {workout.perceivedEffort != null && <span>RPE {workout.perceivedEffort}/10</span>}
                    </div>
                    {workout.notes && (
                      <p className="text-sm text-gray-400 mt-2 italic">{workout.notes}</p>
                    )}
                  </div>
                  {workout.intervals.length > 0 && (
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {workout.intervals.length} intervals
                    </Badge>
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
