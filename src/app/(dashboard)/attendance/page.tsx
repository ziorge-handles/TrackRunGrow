'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Users, ChevronDown, RefreshCw } from 'lucide-react'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'

interface AthleteAttendance {
  athleteId: string
  athleteName: string | null
  athleteEmail: string
  status: AttendanceStatus | null
  availabilityNote: string | null
  attendanceId: string | null
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  PRESENT: { label: 'Present', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  EXCUSED: { label: 'Excused', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
  LATE: { label: 'Late', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
}

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE']

export default function AttendancePage() {
  const [teamId, setTeamId] = useState('')
  const [calendarEventId, setCalendarEventId] = useState('')
  const [athletes, setAthletes] = useState<AthleteAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus | ''>('')

  const loadAttendance = useCallback(async () => {
    if (!teamId || !calendarEventId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?teamId=${teamId}&calendarEventId=${calendarEventId}`)
      if (res.ok) setAthletes(await res.json())
    } finally {
      setLoading(false)
    }
  }, [teamId, calendarEventId])

  function setAthleteStatus(athleteId: string, status: AttendanceStatus) {
    setAthletes((prev) => prev.map((a) => a.athleteId === athleteId ? { ...a, status } : a))
    setSaved(false)
  }

  function setAthleteNote(athleteId: string, note: string) {
    setAthletes((prev) => prev.map((a) => a.athleteId === athleteId ? { ...a, availabilityNote: note } : a))
    setSaved(false)
  }

  function applyBulk() {
    if (!bulkStatus) return
    setAthletes((prev) => prev.map((a) => ({ ...a, status: bulkStatus })))
    setSaved(false)
  }

  async function saveAttendance() {
    if (!teamId || !calendarEventId) return
    setSaving(true)
    try {
      const entries = athletes
        .filter((a) => a.status !== null)
        .map((a) => ({ athleteId: a.athleteId, status: a.status as AttendanceStatus, availabilityNote: a.availabilityNote ?? undefined }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarEventId, teamId, entries }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    present: athletes.filter((a) => a.status === 'PRESENT').length,
    absent: athletes.filter((a) => a.status === 'ABSENT').length,
    excused: athletes.filter((a) => a.status === 'EXCUSED').length,
    late: athletes.filter((a) => a.status === 'LATE').length,
    unmarked: athletes.filter((a) => !a.status).length,
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-500 mt-1">Record attendance for practices, meets, and events</p>
      </div>

      {/* Event Selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Select Event</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Team ID"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={calendarEventId}
            onChange={(e) => setCalendarEventId(e.target.value)}
            placeholder="Calendar Event ID"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={loadAttendance}
            disabled={!teamId || !calendarEventId || loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Load Roster
          </button>
        </div>
      </div>

      {athletes.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {([['present', 'emerald'], ['absent', 'red'], ['excused', 'blue'], ['late', 'amber'], ['unmarked', 'gray']] as const).map(([key, color]) => (
              <div key={key} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold text-${color}-700`}>{stats[key]}</p>
                <p className={`text-xs text-${color}-600 capitalize mt-0.5`}>{key}</p>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">Mark all as:</span>
            <div className="relative">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus | '')}
                className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select status…</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={applyBulk}
              disabled={!bulkStatus}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Apply to All
            </button>
          </div>

          {/* Athlete Grid */}
          <div className="space-y-2">
            {athletes.map((athlete) => (
              <div
                key={athlete.athleteId}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{athlete.athleteName ?? athlete.athleteEmail}</p>
                    {athlete.athleteName && <p className="text-xs text-gray-400 truncate">{athlete.athleteEmail}</p>}
                  </div>
                  {/* Status Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((status) => {
                      const config = STATUS_CONFIG[status]
                      const Icon = config.icon
                      const isActive = athlete.status === status
                      return (
                        <button
                          key={status}
                          onClick={() => setAthleteStatus(athlete.athleteId, status)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[36px] ${isActive ? config.color : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {athlete.status && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={athlete.availabilityNote ?? ''}
                      onChange={(e) => setAthleteNote(athlete.athleteId, e.target.value)}
                      placeholder="Optional note…"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
            {saved && <span className="text-emerald-600 text-sm font-medium">Saved!</span>}
          </div>
        </>
      )}
    </div>
  )
}
