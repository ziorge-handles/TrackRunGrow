import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Activity, TrendingUp, Brain, BarChart2, Camera, Edit2, MapPin, Calendar, Hash } from 'lucide-react'
import { ATHLETE_STATUS_COLORS, ATHLETE_STATUS_LABELS, SPORT_LABELS } from '@/lib/constants'
import { formatTime } from '@/lib/utils'

interface PageProps {
  params: Promise<{ athleteId: string }>
}

export default async function AthleteProfilePage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { athleteId } = await params

  let athlete
  if ((session.user.role === 'COACH' || session.user.role === 'ADMIN')) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id } })
    if (!coach) notFound()

    athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        teams: { include: { team: { include: { school: true } } } },
        bodyMetrics: { orderBy: { recordedAt: 'desc' }, take: 3 },
        eventEntries: { include: { trackEvent: true }, where: { isPrimary: true } },
        personalBests: { include: { trackEvent: true }, orderBy: { achievedAt: 'desc' } },
        raceResults: {
          include: { race: true, trackEvent: true },
          orderBy: { recordedAt: 'desc' },
          take: 5,
        },
        workoutLogs: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    })
    if (!athlete) notFound()

    const teamIds = athlete.teams.map((at) => at.teamId)
    const hasAccess = await prisma.team.findFirst({
      where: {
        id: { in: teamIds },
        OR: [
          { ownerId: session.user.id },
          { coaches: { some: { coachId: coach.id } } },
        ],
      },
    })
    if (!hasAccess) notFound()
  } else {
    const ownAthlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } })
    if (!ownAthlete || ownAthlete.id !== athleteId) notFound()

    athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        teams: { include: { team: { include: { school: true } } } },
        bodyMetrics: { orderBy: { recordedAt: 'desc' }, take: 3 },
        eventEntries: { include: { trackEvent: true }, where: { isPrimary: true } },
        personalBests: { include: { trackEvent: true }, orderBy: { achievedAt: 'desc' } },
        raceResults: { include: { race: true, trackEvent: true }, orderBy: { recordedAt: 'desc' }, take: 5 },
        workoutLogs: { orderBy: { date: 'desc' }, take: 5 },
      },
    })
    if (!athlete) notFound()
  }

  const [totalRaces, weeklyWorkouts] = await Promise.all([
    prisma.raceResult.count({ where: { athleteId } }),
    prisma.workoutLog.findMany({
      where: {
        athleteId,
        date: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const weeklyMileage = weeklyWorkouts.reduce((s, w) => s + (w.distanceMiles ?? 0), 0)
  const latestMetrics = athlete.bodyMetrics[0]
  const isCoach = (session.user.role === 'COACH' || session.user.role === 'ADMIN')
  const basePath = isCoach ? `/athletes/${athleteId}` : `/portal`

  const tabs = isCoach
    ? [
        { href: `${basePath}/performance`, label: 'Performance', icon: TrendingUp },
        { href: `${basePath}/workouts`, label: 'Workouts', icon: Activity },
        { href: `${basePath}/metrics`, label: 'Metrics', icon: BarChart2 },
        { href: `${basePath}/races`, label: 'Races', icon: Trophy },
        { href: `${basePath}/ai`, label: 'AI Plans', icon: Brain },
      ]
    : [
        { href: `/portal/performance`, label: 'Performance', icon: TrendingUp },
        { href: `/portal/workouts`, label: 'Workouts', icon: Activity },
        { href: `/portal/metrics`, label: 'Metrics', icon: BarChart2 },
        { href: `/portal/races`, label: 'Races', icon: Trophy },
      ]

  return (
    <div className="space-y-6 px-4 sm:px-6 py-6 max-w-6xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        {isCoach && (
          <Link href="/athletes" className="mt-1 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">

            {/* Avatar */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              {athlete.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={athlete.photoUrl} alt={athlete.user.name ?? ''} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white">
                  {athlete.user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              {isCoach && (
                <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{athlete.user.name}</h1>
                  <p className="text-sm text-gray-400 mt-0.5">{athlete.user.email}</p>
                </div>
                {isCoach && (
                  <Link
                    href={`${basePath}/edit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className={ATHLETE_STATUS_COLORS[athlete.status]}>
                  {ATHLETE_STATUS_LABELS[athlete.status]}
                </Badge>
                {athlete.teams[0] && (
                  <Badge variant="outline">{SPORT_LABELS[athlete.teams[0].team.sport]}</Badge>
                )}
                {athlete.graduationYear && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />Class of {athlete.graduationYear}
                  </span>
                )}
                {athlete.jerseyNumber && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Hash className="w-3 h-3" />#{athlete.jerseyNumber}
                  </span>
                )}
              </div>

              {athlete.teams.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {athlete.teams.map((at) => (
                    <span key={at.teamId} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                      <MapPin className="w-3 h-3" />{at.team.name}{at.team.school && ` — ${at.team.school.name}`}
                    </span>
                  ))}
                </div>
              )}

              {athlete.eventEntries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {athlete.eventEntries.map((e) => (
                    <span key={e.id} className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1 font-medium">
                      {e.trackEvent.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Races', value: totalRaces, unit: '', color: 'blue' },
          { label: 'Personal Bests', value: athlete.personalBests.length, unit: '', color: 'emerald' },
          { label: 'Weekly Mileage', value: weeklyMileage.toFixed(1), unit: ' mi', color: 'purple' },
          { label: 'VO₂ Max', value: latestMetrics?.vo2Max?.toFixed(1) ?? '—', unit: '', color: 'orange' },
        ].map((stat) => {
          const colorMap: Record<string, string> = {
            blue: 'text-blue-700',
            emerald: 'text-emerald-700',
            purple: 'text-purple-700',
            orange: 'text-orange-700',
          }
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4">
                <p className={`text-2xl font-bold ${colorMap[stat.color]}`}>{stat.value}{stat.unit}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Nav Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-gray-200 overflow-x-auto">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors whitespace-nowrap min-h-[44px]"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* ── Overview Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">
          {/* Personal Bests */}
          {athlete.personalBests.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />Personal Bests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {athlete.personalBests.slice(0, 6).map((pb) => (
                    <div key={pb.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1 truncate">{pb.trackEvent.name}</p>
                      <p className="text-lg font-bold text-gray-900 font-mono">
                        {pb.trackEvent.lowerIsBetter
                          ? formatTime(pb.resultValue)
                          : `${pb.resultValue}${pb.trackEvent.unitLabel}`}
                      </p>
                      <p className="text-xs text-amber-500 mt-0.5">
                        {new Date(pb.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Races */}
          {athlete.raceResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-blue-500" />Recent Races
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium">Race</th>
                        <th className="text-left py-2 pr-4 font-medium">Event</th>
                        <th className="text-left py-2 pr-4 font-medium">Result</th>
                        <th className="text-left py-2 font-medium">Place</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {athlete.raceResults.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-4">
                            <p className="font-medium text-gray-900 line-clamp-1">{r.race.name}</p>
                            <p className="text-xs text-gray-400">{new Date(r.race.date).toLocaleDateString()}</p>
                          </td>
                          <td className="py-2.5 pr-4 text-gray-600 text-xs">{r.trackEvent?.name ?? '—'}</td>
                          <td className="py-2.5 pr-4 font-mono text-gray-900">
                            {r.trackEvent?.lowerIsBetter ? formatTime(r.resultValue) : r.resultValue}
                          </td>
                          <td className="py-2.5 text-gray-500">{r.place ? `#${r.place}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Body Metrics */}
          {latestMetrics && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" />Body Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  {[
                    { label: 'Height', value: latestMetrics.heightCm ? `${latestMetrics.heightCm} cm` : null },
                    { label: 'Weight', value: latestMetrics.weightKg ? `${latestMetrics.weightKg} kg` : null },
                    { label: 'Resting HR', value: latestMetrics.restingHR ? `${latestMetrics.restingHR} bpm` : null },
                    { label: 'Max HR', value: latestMetrics.maxHR ? `${latestMetrics.maxHR} bpm` : null },
                    { label: 'VO₂ Max', value: latestMetrics.vo2Max ? `${latestMetrics.vo2Max.toFixed(1)} mL/kg/min` : null },
                    { label: 'Body Fat', value: latestMetrics.bodyFatPct ? `${latestMetrics.bodyFatPct}%` : null },
                  ].filter((item) => item.value !== null).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <dt className="text-gray-500">{item.label}</dt>
                      <dd className="font-medium text-gray-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs text-gray-400 mt-3">
                  Recorded {new Date(latestMetrics.recordedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent Workouts */}
          {athlete.workoutLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />Recent Workouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {athlete.workoutLogs.map((w) => (
                    <div key={w.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{w.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(w.date).toLocaleDateString()} · {w.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {w.distanceMiles != null && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 flex-shrink-0">
                          {w.distanceMiles.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {athlete.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">{athlete.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
