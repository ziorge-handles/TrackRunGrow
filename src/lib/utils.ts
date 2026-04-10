import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a time in seconds to a human-readable string.
 * Under 10 minutes: "M:SS.xx" (e.g. "4:32.45")
 * 10 minutes or more: "MM:SS" or "H:MM:SS"
 */
export function formatTime(seconds: number): string {
  if (seconds < 600) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    const whole = Math.floor(secs)
    const hundredths = Math.round((secs - whole) * 100)
    const secsStr = whole.toString().padStart(2, '0')
    const hundStr = hundredths.toString().padStart(2, '0')
    return `${minutes}:${secsStr}.${hundStr}`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format a pace in seconds-per-mile to "M:SS /mi"
 */
export function formatPace(secPerMile: number): string {
  const minutes = Math.floor(secPerMile / 60)
  const secs = Math.floor(secPerMile % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')} /mi`
}

/**
 * Format a date to a readable string like "Jan 15, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Safely parse a date string, returning null if invalid.
 */
export function parseDate(dateString: string): Date | null {
  const d = new Date(dateString)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Calculate a trend projection using least-squares linear regression.
 * Results sorted by date; returns slope, intercept, and a projection function.
 */
export function calculateTrendProjection(
  results: Array<{ resultValue: number; achievedAt: Date }>,
): {
  slope: number
  intercept: number
  projectedValue: (daysFromNow: number) => number
} {
  if (results.length < 2) {
    const value = results[0]?.resultValue ?? 0
    return {
      slope: 0,
      intercept: value,
      projectedValue: () => value,
    }
  }

  const now = Date.now()
  const points = results.map((r) => ({
    x: (r.achievedAt.getTime() - now) / (1000 * 60 * 60 * 24), // days relative to now
    y: r.resultValue,
  }))

  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.x, 0)
  const sumY = points.reduce((acc, p) => acc + p.y, 0)
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0)

  const denominator = n * sumX2 - sumX * sumX
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
  const intercept = (sumY - slope * sumX) / n

  return {
    slope,
    intercept,
    projectedValue: (daysFromNow: number) => slope * daysFromNow + intercept,
  }
}
