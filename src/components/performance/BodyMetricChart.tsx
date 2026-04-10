'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'

interface DataPoint {
  date: string
  weightKg?: number
  vo2Max?: number
  restingHR?: number
}

interface Props {
  data: DataPoint[]
}

type MetricKey = 'weightKg' | 'vo2Max' | 'restingHR'

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; unit: string }> = {
  weightKg: { label: 'Weight', color: '#3b82f6', unit: 'kg' },
  vo2Max: { label: 'VO2 Max', color: '#059669', unit: 'mL/kg/min' },
  restingHR: { label: 'Resting HR', color: '#f59e0b', unit: 'bpm' },
}

export function BodyMetricChart({ data }: Props) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weightKg')

  const config = METRIC_CONFIG[activeMetric]

  // Filter data points that have the active metric
  const filteredData = data.filter((d) => d[activeMetric] !== undefined)

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Metrics Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeMetric === key
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeMetric === key ? { backgroundColor: METRIC_CONFIG[key].color } : {}}
              >
                {METRIC_CONFIG[key].label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 text-center py-4">No {config.label} data yet.</p>
        </CardContent>
      </Card>
    )
  }

  const values = filteredData.map((d) => d[activeMetric] as number)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const padding = (maxVal - minVal) * 0.15 || 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart2 className="w-4 h-4 text-blue-500" />
          Metrics Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeMetric === key
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeMetric === key ? { backgroundColor: METRIC_CONFIG[key].color } : {}}
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={filteredData} margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minVal - padding, maxVal + padding]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              width={50}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-900 mb-1">{label}</p>
                    <p style={{ color: config.color }}>
                      {config.label}: {(payload[0].value as number).toFixed(1)} {config.unit}
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
