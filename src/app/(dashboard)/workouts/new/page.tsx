'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { WORKOUT_TYPE_LABELS } from '@/lib/constants'

interface Athlete {
  id: string
  user: { name: string | null }
}

interface Interval {
  setNumber: number
  reps: number
  distanceMeters: string
  targetPaceSec: string
  restSeconds: string
  notes: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [showIntervals, setShowIntervals] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'EASY_RUN' as keyof typeof WORKOUT_TYPE_LABELS,
    title: '',
    description: '',
    distanceMiles: '',
    durationMin: '',
    avgPaceSecPerMile: '',
    avgHR: '',
    perceivedEffort: '',
    notes: '',
  })

  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [intervals, setIntervals] = useState<Interval[]>([])

  useEffect(() => {
    fetch('/api/athletes')
      .then((r) => r.json())
      .then((data: { athletes: Athlete[] }) => setAthletes(data.athletes ?? []))
      .catch(console.error)
  }, [])

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    )
  }

  const selectAll = () => setSelectedAthletes(athletes.map((a) => a.id))
  const selectNone = () => setSelectedAthletes([])

  const addInterval = () => {
    setIntervals((prev) => [
      ...prev,
      {
        setNumber: prev.length + 1,
        reps: 1,
        distanceMeters: '',
        targetPaceSec: '',
        restSeconds: '',
        notes: '',
      },
    ])
  }

  const updateInterval = (index: number, field: keyof Interval, value: string | number) => {
    setIntervals((prev) => prev.map((iv, i) => i === index ? { ...iv, [field]: value } : iv))
  }

  const removeInterval = (index: number) => {
    setIntervals((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedAthletes.length === 0) {
      setError('Please select at least one athlete.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteIds: selectedAthletes,
          date: form.date,
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          distanceMiles: form.distanceMiles ? parseFloat(form.distanceMiles) : undefined,
          durationMin: form.durationMin ? parseFloat(form.durationMin) : undefined,
          avgPaceSecPerMile: form.avgPaceSecPerMile ? parseFloat(form.avgPaceSecPerMile) : undefined,
          avgHR: form.avgHR ? parseInt(form.avgHR) : undefined,
          perceivedEffort: form.perceivedEffort ? parseInt(form.perceivedEffort) : undefined,
          notes: form.notes || undefined,
          intervals: showIntervals && intervals.length > 0
            ? intervals.map((iv) => ({
                setNumber: iv.setNumber,
                reps: iv.reps,
                distanceMeters: iv.distanceMeters ? parseFloat(iv.distanceMeters) : undefined,
                targetPaceSec: iv.targetPaceSec ? parseFloat(iv.targetPaceSec) : undefined,
                restSeconds: iv.restSeconds ? parseFloat(iv.restSeconds) : undefined,
                notes: iv.notes || undefined,
              }))
            : undefined,
        }),
      })

      const data = await res.json() as { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to log workout')
      } else {
        router.push('/dashboard/workouts')
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/workouts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Workout</h1>
        <p className="text-sm text-gray-500 mt-1">Record training for one or more athletes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Athlete Selection */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Select Athletes</CardTitle>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>All</Button>
                <Button type="button" variant="ghost" size="sm" onClick={selectNone}>None</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {athletes.length === 0 ? (
              <p className="text-sm text-gray-400">No athletes found.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {athletes.map((athlete) => (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => toggleAthlete(athlete.id)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition-colors ${
                      selectedAthletes.includes(athlete.id)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {athlete.user.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof form.type }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Easy 6 miles"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="distanceMiles">Distance (mi)</Label>
                <Input
                  id="distanceMiles"
                  type="number"
                  step="0.1"
                  min={0.1}
                  max={100}
                  placeholder="6.0"
                  value={form.distanceMiles}
                  onChange={(e) => setForm((f) => ({ ...f, distanceMiles: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-0.5">Max: 100 mi</p>
              </div>
              <div>
                <Label htmlFor="durationMin">Duration (min)</Label>
                <Input
                  id="durationMin"
                  type="number"
                  step="0.5"
                  min={1}
                  max={600}
                  placeholder="45"
                  value={form.durationMin}
                  onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-0.5">Max: 600 min (10h)</p>
              </div>
              <div>
                <Label htmlFor="avgHR">Avg HR (bpm)</Label>
                <Input
                  id="avgHR"
                  type="number"
                  min={40}
                  max={230}
                  placeholder="145"
                  value={form.avgHR}
                  onChange={(e) => setForm((f) => ({ ...f, avgHR: e.target.value }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-0.5">Range: 40-230</p>
              </div>
              <div>
                <Label htmlFor="perceivedEffort">RPE (1-10)</Label>
                <Input
                  id="perceivedEffort"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="5"
                  value={form.perceivedEffort}
                  onChange={(e) => setForm((f) => ({ ...f, perceivedEffort: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="How did it go? Any observations..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Intervals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Intervals</CardTitle>
              <button
                type="button"
                onClick={() => setShowIntervals(!showIntervals)}
                className="text-sm text-emerald-600 font-medium"
              >
                {showIntervals ? 'Hide' : 'Add Intervals'}
              </button>
            </div>
          </CardHeader>
          {showIntervals && (
            <CardContent className="space-y-3">
              {intervals.map((iv, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <span className="text-xs font-medium text-gray-400 w-6">#{index + 1}</span>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={iv.reps}
                    onChange={(e) => updateInterval(index, 'reps', parseInt(e.target.value))}
                    className="h-7 w-16 text-xs"
                  />
                  <Input
                    placeholder="Dist (m)"
                    value={iv.distanceMeters}
                    onChange={(e) => updateInterval(index, 'distanceMeters', e.target.value)}
                    className="h-7 w-20 text-xs"
                  />
                  <Input
                    placeholder="Pace (s)"
                    value={iv.targetPaceSec}
                    onChange={(e) => updateInterval(index, 'targetPaceSec', e.target.value)}
                    className="h-7 w-20 text-xs"
                  />
                  <Input
                    placeholder="Rest (s)"
                    value={iv.restSeconds}
                    onChange={(e) => updateInterval(index, 'restSeconds', e.target.value)}
                    className="h-7 w-20 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeInterval(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addInterval}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Set
              </Button>
            </CardContent>
          )}
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard/workouts">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging...</> : 'Log Workout'}
          </Button>
        </div>
      </form>
    </div>
  )
}
