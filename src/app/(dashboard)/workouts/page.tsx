import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Activity } from 'lucide-react'
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '@/lib/constants'
import { formatDate, formatTime } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

function getWeekRange(weekStr?: string) {
  let monday: Date
  if (weekStr) {
    monday = new Date(weekStr)
  } else {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday = new Date(now)
    monday.setDate(monday.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
  }

  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

export default async function WorkoutsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { week } = await searchParams
  const { monday, sunday } = getWeekRange(week)

  const prevWeek = new Date(monday)
  prevWeek.setDate(prevWeek.getDate() - 7)
  const nextWeek = new Date(monday)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
  if (!coach) redirect('/dashboard')

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { coaches: { some: { coachId: coach.id } } },
      ],
    },
    include: { athletes: true },
  })

  const athleteIds = [...new Set(teams.flatMap((t) => t.athletes.map((a) => a.athleteId)))]

  const workouts = await prisma.workoutLog.findMany({
    where: {
      athleteId: { in: athleteIds },
      date: { gte: monday, lte: sunday },
    },
    include: {
      athlete: { include: { user: { select: { id: true, name: true } } } },
      intervals: true,
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })

  // Group by date
  const byDate = workouts.reduce<Record<string, typeof workouts>>((acc, w) => {
    const key = w.date.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  const totalMiles = workouts.reduce((sum, w) => sum + (w.distanceMiles ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Team training feed</p>
        </div>
        <Link href="/workouts/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Log Workout
          </Button>
        </Link>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-3">
        <Link href={`/workouts?week=${prevWeek.toISOString().split('T')[0]}`}>
          <Button variant="ghost" size="sm">← Prev Week</Button>
        </Link>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900">
            {monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} –{' '}
            {sunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs text-gray-400">{workouts.length} workouts · {totalMiles.toFixed(1)} miles total</p>
        </div>
        <Link href={`/workouts?week=${nextWeek.toISOString().split('T')[0]}`}>
          <Button variant="ghost" size="sm">Next Week →</Button>
        </Link>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts this week</h3>
            <p className="text-gray-500 mb-6">Log workouts to track team training load.</p>
            <Link href="/workouts/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Log First Workout
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDate).map(([date, dayWorkouts]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <div className="space-y-2">
                {dayWorkouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900">
                              {workout.athlete.user.name}
                            </span>
                            <Badge className={`${WORKOUT_TYPE_COLORS[workout.type]} text-xs`}>
                              {WORKOUT_TYPE_LABELS[workout.type]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{workout.title}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            {workout.distanceMiles != null && (
                              <span>{workout.distanceMiles} mi</span>
                            )}
                            {workout.durationMin != null && (
                              <span>{formatTime(workout.durationMin * 60)}</span>
                            )}
                            {workout.avgPaceSecPerMile != null && (
                              <span>{formatPace(workout.avgPaceSecPerMile)}</span>
                            )}
                            {workout.perceivedEffort != null && (
                              <span>RPE {workout.perceivedEffort}/10</span>
                            )}
                          </div>
                        </div>
                        {workout.intervals.length > 0 && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {workout.intervals.length} sets
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
