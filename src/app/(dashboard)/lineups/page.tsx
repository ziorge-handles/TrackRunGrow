'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Lock, Unlock, Printer, ChevronDown, Trash2, GripVertical } from 'lucide-react'

interface Lineup {
  id: string
  name: string
  raceId: string
  teamId: string
  notes: string | null
  isFinalized: boolean
  createdAt: string
  _count: { entries: number }
}

interface Athlete {
  id: string
  user: { name: string | null; email: string }
  jerseyNumber: string | null
}

interface TrackEvent {
  id: string
  name: string
  category: string
}

interface LineupEntry {
  id: string
  athleteId: string
  trackEventId: string | null
  heatNumber: number | null
  laneNumber: number | null
  seedTime: number | null
  qualifyingMark: number | null
  notes: string | null
  athlete: { user: { name: string | null } }
  trackEvent: TrackEvent | null
}

interface DetailedLineup extends Lineup {
  entries: LineupEntry[]
}

function groupEntriesByEvent(entries: LineupEntry[]): Record<string, LineupEntry[]> {
  const groups: Record<string, LineupEntry[]> = {}
  for (const e of entries) {
    const key = e.trackEvent?.name ?? 'Unassigned'
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

export default function LineupsPage() {
  const [teamId, setTeamId] = useState('')
  const [raceId, setRaceId] = useState('')
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [selectedLineup, setSelectedLineup] = useState<DetailedLineup | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [entryForm, setEntryForm] = useState<{
    athleteId: string
    trackEventId: string
    heatNumber: string
    laneNumber: string
    seedTime: string
    qualifyingMark: string
  }>({ athleteId: '', trackEventId: '', heatNumber: '', laneNumber: '', seedTime: '', qualifyingMark: '' })
  const [saving, setSaving] = useState(false)
  const [isPrintMode, setIsPrintMode] = useState(false)

  async function fetchLineups() {
    if (!teamId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ teamId, ...(raceId ? { raceId } : {}) })
      const res = await fetch(`/api/lineups?${params}`)
      if (res.ok) setLineups(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function fetchAthletes() {
    if (!teamId) return
    const res = await fetch(`/api/athletes?teamId=${teamId}`)
    if (res.ok) {
      const data = await res.json()
      setAthletes(data.athletes ?? data ?? [])
    }
  }

  async function fetchEvents() {
    const res = await fetch('/api/events')
    if (res.ok) setEvents(await res.json())
  }

  async function fetchLineupDetail(lineupId: string) {
    const res = await fetch(`/api/lineups/${lineupId}`)
    if (res.ok) setSelectedLineup(await res.json())
  }

  useEffect(() => {
    fetchAthletes()
    fetchEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  async function createLineup() {
    if (!newName || !raceId || !teamId) return
    setCreating(true)
    try {
      const res = await fetch('/api/lineups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, raceId, teamId }),
      })
      if (res.ok) {
        setNewName('')
        setShowCreate(false)
        fetchLineups()
      }
    } finally {
      setCreating(false)
    }
  }

  async function addEntry() {
    if (!selectedLineup || !entryForm.athleteId) return
    setSaving(true)
    try {
      const entries = [{
        athleteId: entryForm.athleteId,
        trackEventId: entryForm.trackEventId || undefined,
        heatNumber: entryForm.heatNumber ? Number(entryForm.heatNumber) : undefined,
        laneNumber: entryForm.laneNumber ? Number(entryForm.laneNumber) : undefined,
        seedTime: entryForm.seedTime ? Number(entryForm.seedTime) : undefined,
        qualifyingMark: entryForm.qualifyingMark ? Number(entryForm.qualifyingMark) : undefined,
      }]
      const res = await fetch(`/api/lineups/${selectedLineup.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      })
      if (res.ok) {
        setEntryForm({ athleteId: '', trackEventId: '', heatNumber: '', laneNumber: '', seedTime: '', qualifyingMark: '' })
        fetchLineupDetail(selectedLineup.id)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleFinalize() {
    if (!selectedLineup) return
    const res = await fetch(`/api/lineups/${selectedLineup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFinalized: !selectedLineup.isFinalized }),
    })
    if (res.ok) fetchLineupDetail(selectedLineup.id)
  }

  async function deleteLineup(lineupId: string) {
    if (!confirm('Delete this lineup?')) return
    const res = await fetch(`/api/lineups/${lineupId}`, { method: 'DELETE' })
    if (res.ok) {
      if (selectedLineup?.id === lineupId) setSelectedLineup(null)
      fetchLineups()
    }
  }

  const grouped = selectedLineup ? groupEntriesByEvent(selectedLineup.entries) : {}

  return (
    <div className={`space-y-6 px-4 py-6 ${isPrintMode ? 'print:block' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meet Lineups</h1>
          <p className="text-gray-500 mt-1">Build and manage athlete lineup assignments</p>
        </div>
        <button
          onClick={() => setIsPrintMode(!isPrintMode)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Print View
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Team ID"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="text"
          value={raceId}
          onChange={(e) => setRaceId(e.target.value)}
          placeholder="Race ID (optional)"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={fetchLineups}
          disabled={!teamId}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          Load
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lineup List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Lineups</h2>
            <button
              onClick={() => setShowCreate(!showCreate)}
              disabled={!raceId || !teamId}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          {showCreate && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Lineup name"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={createLineup}
                disabled={creating || !newName}
                className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? '…' : 'Create'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
          ) : lineups.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No lineups yet</div>
          ) : (
            lineups.map((l) => (
              <div
                key={l.id}
                className={`border rounded-xl p-4 cursor-pointer transition-colors ${selectedLineup?.id === l.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                onClick={() => fetchLineupDetail(l.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{l.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l._count.entries} entries</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.isFinalized && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLineup(l.id) }}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lineup Builder */}
        <div className="lg:col-span-2">
          {!selectedLineup ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a lineup to edit</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedLineup.name}</h2>
                  <p className="text-sm text-gray-400">{selectedLineup.entries.length} entries</p>
                </div>
                <button
                  onClick={toggleFinalize}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${selectedLineup.isFinalized ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                >
                  {selectedLineup.isFinalized ? <><Unlock className="w-4 h-4" /> Unfinalize</> : <><Lock className="w-4 h-4" /> Finalize Lineup</>}
                </button>
              </div>

              {/* Add Entry Form */}
              {!selectedLineup.isFinalized && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Add Entry</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 sm:col-span-1 relative">
                      <select
                        value={entryForm.athleteId}
                        onChange={(e) => setEntryForm(f => ({ ...f, athleteId: e.target.value }))}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Athlete</option>
                        {athletes.map((a) => (
                          <option key={a.id} value={a.id}>{a.user.name ?? a.user.email}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={entryForm.trackEventId}
                        onChange={(e) => setEntryForm(f => ({ ...f, trackEventId: e.target.value }))}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Event (optional)</option>
                        {events.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <input
                      type="number"
                      value={entryForm.heatNumber}
                      onChange={(e) => setEntryForm(f => ({ ...f, heatNumber: e.target.value }))}
                      placeholder="Heat"
                      min={1}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={entryForm.laneNumber}
                      onChange={(e) => setEntryForm(f => ({ ...f, laneNumber: e.target.value }))}
                      placeholder="Lane"
                      min={1}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={entryForm.seedTime}
                      onChange={(e) => setEntryForm(f => ({ ...f, seedTime: e.target.value }))}
                      placeholder="Seed time (s)"
                      step="0.01"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={entryForm.qualifyingMark}
                      onChange={(e) => setEntryForm(f => ({ ...f, qualifyingMark: e.target.value }))}
                      placeholder="Qual. mark"
                      step="0.01"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={addEntry}
                    disabled={saving || !entryForm.athleteId}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Add Entry'}
                  </button>
                </div>
              )}

              {/* Entries by Event */}
              {Object.keys(grouped).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No entries yet</p>
              ) : (
                Object.entries(grouped).map(([eventName, entries]) => (
                  <div key={eventName}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      {eventName}
                      <span className="text-xs font-normal text-gray-400">({entries.length})</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                            <th className="text-left py-2 pr-4 font-medium">Athlete</th>
                            <th className="text-left py-2 pr-4 font-medium">Heat</th>
                            <th className="text-left py-2 pr-4 font-medium">Lane</th>
                            <th className="text-left py-2 pr-4 font-medium">Seed</th>
                            <th className="text-left py-2 font-medium">Qual. Mark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {entries.map((e) => (
                            <tr key={e.id} className="group">
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                                  <span className="font-medium text-gray-900">{e.athlete.user.name ?? '—'}</span>
                                </div>
                              </td>
                              <td className="py-2 pr-4 text-gray-600">{e.heatNumber ?? '—'}</td>
                              <td className="py-2 pr-4 text-gray-600">{e.laneNumber ?? '—'}</td>
                              <td className="py-2 pr-4 text-gray-600 font-mono">{e.seedTime ? `${e.seedTime}s` : '—'}</td>
                              <td className="py-2 text-gray-600">{e.qualifyingMark ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
