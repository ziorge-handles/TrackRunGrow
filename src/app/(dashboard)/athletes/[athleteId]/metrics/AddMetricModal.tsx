'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'

interface Props {
  athleteId: string
}

export default function AddMetricModal({ athleteId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    recordedAt: new Date().toISOString().split('T')[0],
    weightKg: '',
    heightCm: '',
    restingHR: '',
    maxHR: '',
    vo2Max: '',
    bodyFatPct: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/athletes/${athleteId}/body-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordedAt: form.recordedAt,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
          heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
          restingHR: form.restingHR ? parseInt(form.restingHR) : undefined,
          maxHR: form.maxHR ? parseInt(form.maxHR) : undefined,
          vo2Max: form.vo2Max ? parseFloat(form.vo2Max) : undefined,
          bodyFatPct: form.bodyFatPct ? parseFloat(form.bodyFatPct) : undefined,
          notes: form.notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to save metric')
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Metric
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Body Metrics</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="recordedAt">Date</Label>
              <Input
                id="recordedAt"
                type="date"
                value={form.recordedAt}
                onChange={(e) => setForm((f) => ({ ...f, recordedAt: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weightKg">Weight (kg)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 65.5"
                  value={form.weightKg}
                  onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 175"
                  value={form.heightCm}
                  onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="restingHR">Resting HR (bpm)</Label>
                <Input
                  id="restingHR"
                  type="number"
                  placeholder="e.g. 52"
                  value={form.restingHR}
                  onChange={(e) => setForm((f) => ({ ...f, restingHR: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="vo2Max">VO2 Max</Label>
                <Input
                  id="vo2Max"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 55.2"
                  value={form.vo2Max}
                  onChange={(e) => setForm((f) => ({ ...f, vo2Max: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bodyFatPct">Body Fat %</Label>
                <Input
                  id="bodyFatPct"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 12.5"
                  value={form.bodyFatPct}
                  onChange={(e) => setForm((f) => ({ ...f, bodyFatPct: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxHR">Max HR (bpm)</Label>
                <Input
                  id="maxHR"
                  type="number"
                  placeholder="e.g. 195"
                  value={form.maxHR}
                  onChange={(e) => setForm((f) => ({ ...f, maxHR: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
