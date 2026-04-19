'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'

interface Team {
  id: string
  name: string
  sport: string
}

export default function NewAthletePage() {
  const router = useRouter()

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    teamId: '',
    graduationYear: '',
    gender: '',
    jerseyNumber: '',
  })

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data: { teams: Team[] }) => {
        setTeams(data.teams ?? [])
        if (data.teams?.length === 1) {
          setForm((prev) => ({ ...prev, teamId: data.teams[0].id }))
        }
      })
      .catch(console.error)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.name.trim() || !form.email.trim() || !form.teamId) {
      setError('Name, email, and team are required.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          teamId: form.teamId,
          graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
          gender: form.gender || undefined,
          jerseyNumber: form.jerseyNumber || undefined,
        }),
      })

      const data = await res.json() as { athlete?: { id: string }; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to create athlete')
      } else {
        router.push(`/athletes/${data.athlete!.id}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/athletes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Roster
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Athlete</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add an athlete to your team. If they don&apos;t have an account yet, one will be created automatically and a welcome email will be sent.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            Athlete Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Marcus Johnson"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="athlete@example.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Team <span className="text-red-500">*</span>
                </label>
                <select
                  name="teamId"
                  value={form.teamId}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.sport})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Graduation Year</label>
                <Input
                  name="graduationYear"
                  type="number"
                  value={form.graduationYear}
                  onChange={handleChange}
                  placeholder="e.g. 2026"
                  min={2024}
                  max={2035}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select gender...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Jersey Number</label>
                <Input
                  name="jerseyNumber"
                  value={form.jerseyNumber}
                  onChange={handleChange}
                  placeholder="e.g. 42"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/athletes">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Athlete
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
