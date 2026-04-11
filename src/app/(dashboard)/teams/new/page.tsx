'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewTeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    sport: 'XC' as 'XC' | 'TRACK',
    season: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    gender: 'COED' as 'COED' | 'MALE' | 'FEMALE' | 'OTHER',
    schoolName: '',
    schoolCity: '',
    schoolState: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          gender: form.gender === 'COED' ? undefined : form.gender || undefined,
        }),
      })

      const data = await res.json() as { team?: { id: string }; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to create team')
      } else if (data.team) {
        router.push(`/teams/${data.team.id}`)
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
        <Link href="/teams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Teams
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up your team and start managing athletes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Team Name<span className="text-red-500 ml-1">*</span></Label>
              <Input
                id="name"
                placeholder="e.g. Varsity Cross Country"
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
                          ? s === 'XC'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'XC' ? 'Cross Country' : 'Track & Field'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((f) => ({ ...f, gender: v as typeof form.gender }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COED">Co-ed / Not specified</SelectItem>
                    <SelectItem value="MALE">Boys / Men</SelectItem>
                    <SelectItem value="FEMALE">Girls / Women</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="season">Season<span className="text-red-500 ml-1">*</span></Label>
              <Input
                id="season"
                placeholder="e.g. 2025-2026"
                value={form.season}
                onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schoolName">School Name<span className="text-red-500 ml-1">*</span></Label>
              <Input
                id="schoolName"
                placeholder="e.g. Lincoln High School"
                value={form.schoolName}
                onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolCity">City</Label>
                <Input
                  id="schoolCity"
                  placeholder="e.g. Springfield"
                  value={form.schoolCity}
                  onChange={(e) => setForm((f) => ({ ...f, schoolCity: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="schoolState">State</Label>
                <Input
                  id="schoolState"
                  placeholder="e.g. IL"
                  value={form.schoolState}
                  onChange={(e) => setForm((f) => ({ ...f, schoolState: e.target.value }))}
                  className="mt-1"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/teams">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Team'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
