'use client'

import { useState, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  description: string | null
  color: string | null
  teamId: string | null
}

interface CreateForm {
  title: string
  type: keyof typeof CALENDAR_EVENT_COLORS
  startTime: string
  endTime: string
  allDay: boolean
  location: string
  description: string
}

export default function CalendarPage() {
  const calRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [saving, setSaving] = useState(false)

  const [createForm, setCreateForm] = useState<CreateForm>({
    title: '',
    type: 'PRACTICE',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    description: '',
  })

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
      console.error('Failed to fetch calendar events:', err)
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
    extendedProps: { event: e },
  }))

  const handleDateClick = (arg: DateClickArg) => {
    setCreateForm((f) => ({
      ...f,
      startTime: arg.dateStr + (arg.allDay ? '' : 'T08:00'),
      endTime: arg.dateStr + (arg.allDay ? '' : 'T09:00'),
      allDay: arg.allDay,
    }))
    setCreateOpen(true)
  }

  const handleEventClick = (arg: EventClickArg) => {
    const e = arg.event.extendedProps.event as CalEvent
    setSelectedEvent(e)
    setViewOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          type: createForm.type,
          startTime: createForm.startTime,
          endTime: createForm.endTime || undefined,
          allDay: createForm.allDay,
          location: createForm.location || undefined,
          description: createForm.description || undefined,
          color: CALENDAR_EVENT_COLORS[createForm.type],
        }),
      })

      if (res.ok) {
        const data = await res.json() as { event: CalEvent }
        setEvents((prev) => [...prev, data.event])
        setCreateOpen(false)
        setCreateForm({ title: '', type: 'PRACTICE', startTime: '', endTime: '', allDay: false, location: '', description: '' })
      }
    } catch (err) {
      console.error('Failed to create event:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    try {
      await fetch(`/api/calendar/${selectedEvent.id}`, { method: 'DELETE' })
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id))
      setViewOpen(false)
      setSelectedEvent(null)
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Team schedule and events</p>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
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
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={(info) => fetchEvents(info.start, info.end)}
          editable={true}
          selectable={true}
          height="auto"
          eventDrop={async (arg: EventDropArg) => {
            const { id } = arg.event
            const newStart = arg.event.startStr
            const newEnd = arg.event.endStr

            try {
              await fetch(`/api/calendar/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  startTime: newStart,
                  endTime: newEnd || undefined,
                }),
              })
            } catch {
              arg.revert()
            }
          }}
        />
      </div>

      {/* Create Event Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="cal-title">Title</Label>
              <Input
                id="cal-title"
                placeholder="Event title"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={createForm.type}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v as typeof f.type }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CALENDAR_EVENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cal-location">Location</Label>
                <Input
                  id="cal-location"
                  placeholder="optional"
                  value={createForm.location}
                  onChange={(e) => setCreateForm((f) => ({ ...f, location: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cal-start">Start</Label>
                <Input
                  id="cal-start"
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm((f) => ({ ...f, startTime: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cal-end">End</Label>
                <Input
                  id="cal-end"
                  type="datetime-local"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Edit Event Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CALENDAR_EVENT_COLORS[selectedEvent.type as keyof typeof CALENDAR_EVENT_COLORS] ?? '#6b7280' }}
                />
                <span className="text-sm text-gray-600">
                  {CALENDAR_EVENT_LABELS[selectedEvent.type as keyof typeof CALENDAR_EVENT_LABELS] ?? selectedEvent.type}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {new Date(selectedEvent.startTime).toLocaleString()}
                {selectedEvent.endTime && ` — ${new Date(selectedEvent.endTime).toLocaleString()}`}
              </p>
              {selectedEvent.location && (
                <p className="text-sm text-gray-500">{selectedEvent.location}</p>
              )}
              {selectedEvent.description && (
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDeleteEvent}
                >
                  Delete
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setViewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
