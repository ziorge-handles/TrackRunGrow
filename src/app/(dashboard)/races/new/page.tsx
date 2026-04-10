'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSport } from '@/lib/sport-context'

interface Team {
  id: string
  name: string
  sport: string
}

export default function NewRacePage() {
  const router = useRouter()
  const { sport } = useSport()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])

  const [form, setForm] = useState({
    name: '',
    sport: sport,
    date: '',
    teamId: '',
    location: '',
    isHome: false,
    courseDescription: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data: { teams: Team[] }) => setTeams(data.teams ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    setForm((f) => ({ ...f, sport }))
  }, [sport])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          teamId: form.teamId || undefined,
        }),
      })

      const data = await res.json() as { race?: { id: string }; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to create race')
      } else if (data.race) {
        router.push(`/races/${data.race.id}`)
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/races">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Races
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Race</h1>
        <p className="text-sm text-gray-500 mt-1">Schedule a new race event.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Race Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Race Name<span className="text-red-500 ml-1">*</span></Label>
              <Input
                id="name"
                placeholder="e.g. Regional Championships"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sport<span className="text-red-500 ml-1">*</span></Label>
                <div className="flex gap-2 mt-1">
                  {(['XC', 'TRACK'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sport: s }))}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.sport === s
                          ? s === 'XC' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'XC' ? 'XC' : 'Track'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="date">Date<span className="text-red-500 ml-1">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="team">Team</Label>
              <Select value={form.teamId} onValueChange={(v) => setForm((f) => ({ ...f, teamId: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Riverside Park, Springfield"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHome"
                checked={form.isHome}
                onChange={(e) => setForm((f) => ({ ...f, isHome: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isHome">Home meet</Label>
            </div>

            {form.sport === 'XC' && (
              <div>
                <Label htmlFor="courseDescription">Course Description</Label>
                <textarea
                  id="courseDescription"
                  placeholder="Terrain, hills, surface type..."
                  value={form.courseDescription}
                  onChange={(e) => setForm((f) => ({ ...f, courseDescription: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/races">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Race'}
          </Button>
        </div>
      </form>
    </div>
  )
}
