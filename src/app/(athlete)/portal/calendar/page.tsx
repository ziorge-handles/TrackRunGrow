'use client'

import { useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput } from '@fullcalendar/core'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CALENDAR_EVENT_COLORS, CALENDAR_EVENT_LABELS } from '@/lib/constants'

interface CalEvent {
  id: string
  title: string
  type: string
  startTime: string
  endTime: string | null
  allDay: boolean
  location: string | null
  color: string | null
}

export default function AthletePortalCalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      })
      const res = await fetch(`/api/calendar?${params}`)
      const data = await res.json() as { events: CalEvent[] }
      setEvents(data.events ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const calendarEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime ?? undefined,
    allDay: e.allDay,
    backgroundColor: e.color ?? CALENDAR_EVENT_COLORS[e.type as keyof typeof CALENDAR_EVENT_COLORS] ?? '#6b7280',
    borderColor: 'transparent',
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Team Calendar</h2>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      <div className="flex flex-wrap gap-3 mb-2">
        {Object.entries(CALENDAR_EVENT_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CALENDAR_EVENT_COLORS[type as keyof typeof CALENDAR_EVENT_COLORS] }}
            />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={calendarEvents}
          datesSet={(info) => fetchEvents(info.start, info.end)}
          editable={false}
          selectable={false}
          height="auto"
        />
      </div>
    </div>
  )
}
