import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BodyMetricChart } from '@/components/performance/BodyMetricChart'
import { BarChart2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AthletePortalMetricsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  let athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } })
  if (!athlete) {
    athlete = await prisma.athlete.create({ data: { userId: session.user.id } })
  }

  const metrics = await prisma.bodyMetric.findMany({
    where: { athleteId: athlete.id },
    orderBy: { recordedAt: 'desc' },
  })

  const chartData = metrics
    .slice()
    .reverse()
    .map((m) => ({
      date: m.recordedAt.toISOString().split('T')[0],
      weightKg: m.weightKg ?? undefined,
      vo2Max: m.vo2Max ?? undefined,
      restingHR: m.restingHR ?? undefined,
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Body Metrics</h2>
      </div>

      {chartData.length > 0 && (
        <BodyMetricChart data={chartData} />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {metrics.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No metrics recorded yet. Your coach will add these for you.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Height (cm)</TableHead>
                  <TableHead>VO2 Max</TableHead>
                  <TableHead>Resting HR</TableHead>
                  <TableHead>Body Fat %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{formatDate(m.recordedAt)}</TableCell>
                    <TableCell>{m.weightKg ?? '—'}</TableCell>
                    <TableCell>{m.heightCm ?? '—'}</TableCell>
                    <TableCell>{m.vo2Max ?? '—'}</TableCell>
                    <TableCell>{m.restingHR ?? '—'}</TableCell>
                    <TableCell>{m.bodyFatPct != null ? `${m.bodyFatPct}%` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
