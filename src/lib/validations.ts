import { z } from 'zod'

// ─── Time Parsing ─────────────────────────────────────────────────────────────
// Accepts: "5:42.30" (M:SS.xx), "17:42.30" (MM:SS.xx), "342.3" (raw seconds), "1:05:30" (H:MM:SS)
export function parseTimeToSeconds(input: string): number | null {
  const trimmed = input.trim()

  // H:MM:SS format
  const hmsMatch = trimmed.match(/^(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/)
  if (hmsMatch) {
    const hours = parseInt(hmsMatch[1])
    const mins = parseInt(hmsMatch[2])
    const secs = parseFloat(hmsMatch[3])
    if (mins >= 60 || secs >= 60) return null
    return hours * 3600 + mins * 60 + secs
  }

  // M:SS.xx or MM:SS.xx format
  const msMatch = trimmed.match(/^(\d{1,3}):(\d{1,2}(?:\.\d+)?)$/)
  if (msMatch) {
    const mins = parseInt(msMatch[1])
    const secs = parseFloat(msMatch[2])
    if (secs >= 60) return null
    return mins * 60 + secs
  }

  // Raw seconds
  const num = parseFloat(trimmed)
  if (!isNaN(num) && num > 0) return num

  return null
}

// ─── Distance Parsing ─────────────────────────────────────────────────────────
// Field events: accepts meters OR feet'inches" format
// "7.5" or "7.5m" → 7.5 meters
// "24'6" or "24'6\"" or "24-6" → converts to meters
// "24'" → 24 feet, 0 inches → meters

export function parseDistanceToMeters(input: string): number | null {
  const trimmed = input.trim()

  // Feet and inches: 24'6", 24'6, 24' 6", 24ft 6in
  const ftInMatch = trimmed.match(/^(\d+)['\u2019]\s*(\d+(?:\.\d+)?)["\u201D]?\s*$/)
  if (ftInMatch) {
    const feet = parseInt(ftInMatch[1])
    const inches = parseFloat(ftInMatch[2])
    if (inches >= 12) return null
    return (feet + inches / 12) * 0.3048
  }

  // Feet only: 24'
  const ftOnlyMatch = trimmed.match(/^(\d+)['\u2019]\s*$/)
  if (ftOnlyMatch) {
    return parseInt(ftOnlyMatch[1]) * 0.3048
  }

  // Feet-inches with dash: 24-6
  const dashMatch = trimmed.match(/^(\d+)-(\d+(?:\.\d+)?)$/)
  if (dashMatch) {
    const feet = parseInt(dashMatch[1])
    const inches = parseFloat(dashMatch[2])
    if (inches >= 12) return null
    return (feet + inches / 12) * 0.3048
  }

  // Meters with optional "m": "7.5" or "7.5m"
  const metersMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*m?\s*$/)
  if (metersMatch) {
    const meters = parseFloat(metersMatch[1])
    if (meters > 0 && meters < 150) return meters // reasonable field event range
    return null
  }

  return null
}

// Convert meters to feet-inches display string
export function metersToFeetInches(meters: number): string {
  const totalInches = meters / 0.0254
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches.toFixed(1)}"`
}

// ─── Field event detection ────────────────────────────────────────────────────

export const FIELD_EVENT_NAMES = [
  'High Jump',
  'Long Jump',
  'Triple Jump',
  'Pole Vault',
  'Shot Put',
  'Discus',
  'Javelin',
]

export function isFieldEventName(eventName: string): boolean {
  return FIELD_EVENT_NAMES.some(
    (fe) => eventName.toLowerCase().includes(fe.toLowerCase()),
  )
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const emailSchema = z.string().email('Invalid email address').max(254, 'Email too long')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')

export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long').trim()

export const teamNameSchema = z
  .string()
  .min(1, 'Team name is required')
  .max(100, 'Team name too long')
  .trim()

export const seasonSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, 'Season must be in YYYY-YYYY format (e.g. 2025-2026)')

export const jerseyNumberSchema = z
  .string()
  .max(10, 'Jersey number too long')
  .regex(/^[A-Za-z0-9]*$/, 'Only letters and numbers allowed')
  .optional()
  .or(z.literal(''))

export const raceResultSchema = z.object({
  athleteId: z.string().min(1),
  trackEventId: z.string().optional(),
  resultValue: z.number().positive('Result must be positive'),
  place: z.number().int().positive().optional(),
  teamPlace: z.number().int().positive().optional(),
  dnf: z.boolean().optional(),
  dns: z.boolean().optional(),
  dq: z.boolean().optional(),
  notes: z.string().max(500).optional(),
})

export const bodyMetricSchema = z.object({
  heightCm: z.number().min(50, 'Min 50cm').max(250, 'Max 250cm').optional().nullable(),
  weightKg: z.number().min(20, 'Min 20kg').max(250, 'Max 250kg').optional().nullable(),
  restingHR: z.number().int().min(25, 'Min 25 bpm').max(150, 'Max 150 bpm').optional().nullable(),
  maxHR: z.number().int().min(80, 'Min 80 bpm').max(230, 'Max 230 bpm').optional().nullable(),
  vo2Max: z.number().min(10, 'Min 10').max(95, 'Max 95').optional().nullable(),
  bodyFatPct: z.number().min(2, 'Min 2%').max(60, 'Max 60%').optional().nullable(),
  notes: z.string().max(500).optional(),
})

export const workoutSchema = z.object({
  distanceMiles: z.number().min(0).max(100, 'Max 100 miles').optional().nullable(),
  durationMin: z.number().min(0).max(600, 'Max 10 hours').optional().nullable(),
  avgHR: z.number().int().min(40).max(230).optional().nullable(),
  perceivedEffort: z.number().int().min(1, 'Min 1').max(10, 'Max 10').optional().nullable(),
})
