import type { Sport, WorkoutType, AthleteStatus, CalendarEventType } from '@/generated/prisma/client'

export const SPORT_COLORS: Record<Sport, string> = {
  XC: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  TRACK: 'bg-blue-100 text-blue-800 border-blue-200',
}

export const SPORT_LABELS: Record<Sport, string> = {
  XC: 'Cross Country',
  TRACK: 'Track & Field',
}

export const SPORT_ACCENT: Record<Sport, string> = {
  XC: 'emerald',
  TRACK: 'blue',
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  EASY_RUN: 'Easy Run',
  TEMPO: 'Tempo',
  INTERVAL: 'Intervals',
  LONG_RUN: 'Long Run',
  RECOVERY: 'Recovery',
  STRENGTH: 'Strength',
  CROSS_TRAINING: 'Cross Training',
  RACE: 'Race',
  REST: 'Rest',
  CUSTOM: 'Custom',
}

export const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  EASY_RUN: 'bg-green-100 text-green-800',
  TEMPO: 'bg-orange-100 text-orange-800',
  INTERVAL: 'bg-red-100 text-red-800',
  LONG_RUN: 'bg-purple-100 text-purple-800',
  RECOVERY: 'bg-sky-100 text-sky-800',
  STRENGTH: 'bg-yellow-100 text-yellow-800',
  CROSS_TRAINING: 'bg-teal-100 text-teal-800',
  RACE: 'bg-rose-100 text-rose-800',
  REST: 'bg-gray-100 text-gray-600',
  CUSTOM: 'bg-indigo-100 text-indigo-800',
}

export const ATHLETE_STATUS_COLORS: Record<AthleteStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INJURED: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  REDSHIRT: 'bg-yellow-100 text-yellow-800',
}

export const ATHLETE_STATUS_LABELS: Record<AthleteStatus, string> = {
  ACTIVE: 'Active',
  INJURED: 'Injured',
  INACTIVE: 'Inactive',
  REDSHIRT: 'Redshirt',
}

export const CALENDAR_EVENT_COLORS: Record<CalendarEventType, string> = {
  RACE: '#ef4444',       // red-500
  PRACTICE: '#3b82f6',   // blue-500
  MEET: '#f97316',       // orange-500
  TEAM_MEETING: '#8b5cf6', // violet-500
  REST_DAY: '#6b7280',   // gray-500
}

export const CALENDAR_EVENT_LABELS: Record<CalendarEventType, string> = {
  RACE: 'Race',
  PRACTICE: 'Practice',
  MEET: 'Meet',
  TEAM_MEETING: 'Team Meeting',
  REST_DAY: 'Rest Day',
}

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/dashboard/teams', label: 'Teams', icon: 'Users' },
  { href: '/dashboard/athletes', label: 'Athletes', icon: 'User' },
  { href: '/dashboard/races', label: 'Races', icon: 'Trophy' },
  { href: '/dashboard/workouts', label: 'Workouts', icon: 'Activity' },
  { href: '/dashboard/calendar', label: 'Calendar', icon: 'Calendar' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'Settings' },
] as const
