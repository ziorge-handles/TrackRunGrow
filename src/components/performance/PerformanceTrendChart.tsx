'use client'

import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { calculateTrendProjection, formatTime } from '@/lib/utils'

interface ResultPoint {
  id: string
  resultValue: number
  recordedAt: Date | string
  raceName: string
}

interface Props {
  results: ResultPoint[]
  eventName: string
  lowerIsBetter: boolean
  unitLabel: string
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function formatValue(value: number, lowerIsBetter: boolean, unitLabel: string): string {
  if (lowerIsBetter) return formatTime(value)
  return `${value}${unitLabel}`
}

interface ChartPoint {
  date: string
  result: number | undefined
  trend: number | undefined
  raceName: string
}

export function PerformanceTrendChart({ results, lowerIsBetter, unitLabel }: Props) {
  const chartData = useMemo(() => {
    if (results.length === 0) return []

    const trendInput = results.map((r) => ({
      resultValue: r.resultValue,
      achievedAt: new Date(r.recordedAt),
    }))

    const { projectedValue } = calculateTrendProjection(trendInput)

    const now = new Date().getTime()
    const data: ChartPoint[] = results.map((r) => {
      const date = new Date(r.recordedAt)
      const daysFromNow = (date.getTime() - now) / (1000 * 60 * 60 * 24)
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        result: r.resultValue,
        trend: projectedValue(daysFromNow),
        raceName: r.raceName,
      }
    })

    if (results.length >= 2) {
      data.push({
        date: new Date(now + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
        }),
        result: undefined,
        trend: projectedValue(30),
        raceName: 'Projected',
      })
    }

    return data
  }, [results])

  if (results.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No results to display
      </div>
    )
  }

  const prValue = lowerIsBetter
    ? Math.min(...results.map((r) => r.resultValue))
    : Math.max(...results.map((r) => r.resultValue))

  // Y-axis domain with padding
  const allValues = results.map((r) => r.resultValue)
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const padding = (maxVal - minVal) * 0.1 || 5
  const yDomain = lowerIsBetter
    ? [minVal - padding, maxVal + padding]
    : [minVal - padding, maxVal + padding]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatValue(v, lowerIsBetter, unitLabel)}
          width={70}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-900 mb-1">{label}</p>
                {(payload as unknown as TooltipPayload[]).map((entry) => (
                  entry.value != null && (
                    <p key={entry.name} style={{ color: entry.color }}>
                      {entry.name}: {formatValue(entry.value, lowerIsBetter, unitLabel)}
                    </p>
                  )
                ))}
              </div>
            )
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
        />
        <ReferenceLine
          y={prValue}
          stroke="#f59e0b"
          strokeDasharray="6 3"
          label={{ value: 'PR', position: 'right', fill: '#f59e0b', fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="result"
          name="Result"
          stroke="#059669"
          strokeWidth={2}
          dot={{ fill: '#059669', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="trend"
          name="Trend"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          connectNulls={true}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
