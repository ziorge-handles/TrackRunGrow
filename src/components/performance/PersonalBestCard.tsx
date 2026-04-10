'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface PersonalBest {
  id: string
  resultValue: number
  achievedAt: Date | string
  trackEvent: {
    id: string
    name: string
    unitLabel: string
    lowerIsBetter: boolean
  }
}

interface Props {
  personalBests: PersonalBest[]
}

function isThisSeason(date: Date | string): boolean {
  const d = new Date(date)
  const now = new Date()
  // Current year or within last 12 months
  return now.getFullYear() === d.getFullYear()
}

function formatResult(value: number, lowerIsBetter: boolean, unitLabel: string): string {
  if (lowerIsBetter) return formatTime(value)
  return `${value}${unitLabel}`
}

export function PersonalBestCard({ personalBests }: Props) {
  if (personalBests.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-amber-500" />
          Personal Bests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {personalBests.map((pb) => {
            const thisSeason = isThisSeason(pb.achievedAt)
            return (
              <div
                key={pb.id}
                className={`rounded-xl p-3 border ${
                  thisSeason
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs font-medium ${thisSeason ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {pb.trackEvent.name}
                  </p>
                  {thisSeason && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                      New
                    </span>
                  )}
                </div>
                <p className={`text-lg font-bold font-mono ${thisSeason ? 'text-emerald-900' : 'text-gray-900'}`}>
                  {formatResult(pb.resultValue, pb.trackEvent.lowerIsBetter, pb.trackEvent.unitLabel)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(pb.achievedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
