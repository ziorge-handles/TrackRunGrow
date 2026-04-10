'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PhotoUpload from '@/components/ui/PhotoUpload'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

interface AthleteData {
  id: string
  status: string
  jerseyNumber: string | null
  graduationYear: number | null
  gender: string | null
  notes: string | null
  dateOfBirth: string | null
  photoUrl: string | null
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

export default function EditAthletePage() {
  const params = useParams()
  const router = useRouter()
  const athleteId = params.athleteId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    status: 'ACTIVE',
    jerseyNumber: '',
    graduationYear: '',
    gender: '',
    notes: '',
    dateOfBirth: '',
  })

  const [athleteName, setAthleteName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/athletes/${athleteId}`)
      .then((r) => r.json())
      .then((data: { athlete: AthleteData }) => {
        const a = data.athlete
        setAthleteName(a.user.name ?? '')
        setPhotoUrl(a.photoUrl ?? null)
        setForm({
          status: a.status ?? 'ACTIVE',
          jerseyNumber: a.jerseyNumber ?? '',
          graduationYear: a.graduationYear?.toString() ?? '',
          gender: a.gender ?? '',
          notes: a.notes ?? '',
          dateOfBirth: a.dateOfBirth ? new Date(a.dateOfBirth).toISOString().slice(0, 10) : '',
        })
      })
      .catch(() => setError('Failed to load athlete data'))
      .finally(() => setLoading(false))
  }, [athleteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/athletes/${athleteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          jerseyNumber: form.jerseyNumber || undefined,
          graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
          gender: form.gender || undefined,
          notes: form.notes || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
        }),
      })

      const data = await res.json() as { athlete?: AthleteData; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to update athlete')
      } else {
        router.push(`/dashboard/athletes/${athleteId}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/athletes/${athleteId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Profile
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Athlete</h1>
        {athleteName && (
          <p className="text-sm text-gray-500 mt-1">Editing {athleteName}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Athlete Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUpload
              athleteId={athleteId}
              currentUrl={photoUrl}
              onUpload={(url) => setPhotoUrl(url)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Athlete Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status<span className="text-red-500 ml-1">*</span></Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INJURED">Injured</option>
                <option value="INACTIVE">Inactive</option>
                <option value="REDSHIRT">Redshirt</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jerseyNumber">Jersey Number</Label>
                <Input
                  id="jerseyNumber"
                  value={form.jerseyNumber}
                  onChange={(e) => setForm((f) => ({ ...f, jerseyNumber: e.target.value }))}
                  placeholder="e.g. 42"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={form.graduationYear}
                  onChange={(e) => setForm((f) => ({ ...f, graduationYear: e.target.value }))}
                  placeholder="e.g. 2026"
                  min={2024}
                  max={2035}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Coach notes about this athlete..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <Link href={`/dashboard/athletes/${athleteId}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
