'use client'

import { useState } from 'react'
import { CheckSquare, Plus, CheckCircle, Circle, Users, ChevronRight } from 'lucide-react'

interface TrackingListItem {
  id: string
  athleteId: string
  notes: string | null
  isComplete: boolean
  completedAt: string | null
  athlete: { user: { name: string | null; email: string } }
}

interface TrackingList {
  id: string
  name: string
  description: string | null
  createdAt: string
  items: TrackingListItem[]
  _count: { items: number }
}

const EXAMPLE_LISTS = [
  { name: 'Physicals Needed', description: 'Athletes who still need to submit their physical form', color: 'red' },
  { name: 'State Qualifiers', description: 'Athletes who have qualified for the state meet', color: 'emerald' },
  { name: 'Equipment Return', description: 'Athletes who need to return team equipment', color: 'amber' },
]

export default function TrackingPage() {
  const [teamId, setTeamId] = useState('')
  const [lists, setLists] = useState<TrackingList[]>([])
  const [selectedList, setSelectedList] = useState<TrackingList | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [newAthleteId, setNewAthleteId] = useState('')
  const [addingAthlete, setAddingAthlete] = useState(false)

  async function fetchLists() {
    if (!teamId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tracking-lists?teamId=${teamId}`)
      if (res.ok) {
        const data = await res.json()
        setLists(data)
        if (selectedList) {
          const updated = data.find((l: TrackingList) => l.id === selectedList.id)
          if (updated) setSelectedList(updated)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function createList(name?: string, description?: string) {
    const listName = name ?? newList.name
    if (!listName || !teamId) return
    setCreating(true)
    try {
      const res = await fetch('/api/tracking-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, name: listName, description: description ?? newList.description }),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewList({ name: '', description: '' })
        fetchLists()
      }
    } finally {
      setCreating(false)
    }
  }

  async function toggleItem(listId: string, itemId: string, currentState: boolean) {
    await fetch(`/api/tracking-lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isComplete: !currentState }),
    })
    fetchLists()
  }

  async function addAthleteToList() {
    if (!selectedList || !newAthleteId) return
    setAddingAthlete(true)
    try {
      await fetch(`/api/tracking-lists/${selectedList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: newAthleteId }),
      })
      setNewAthleteId('')
      fetchLists()
    } finally {
      setAddingAthlete(false)
    }
  }

  const completedCount = selectedList?.items.filter((i) => i.isComplete).length ?? 0
  const totalCount = selectedList?.items.length ?? 0

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tracking Lists</h1>
          <p className="text-gray-500 mt-1">Custom checklists for team management tasks</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Team Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Enter Team ID"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button onClick={fetchLists} disabled={!teamId || loading} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          {loading ? '…' : 'Load'}
        </button>
      </div>

      {/* Example Lists */}
      {lists.length === 0 && teamId && !loading && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Quick start with example lists:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXAMPLE_LISTS.map((ex) => (
              <button
                key={ex.name}
                onClick={() => createList(ex.name, ex.description)}
                disabled={creating}
                className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
              >
                <p className="font-medium text-gray-900 text-sm">{ex.name}</p>
                <p className="text-xs text-gray-400 mt-1">{ex.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {lists.map((list) => {
            const pct = list._count.items > 0
              ? (list.items.filter((i) => i.isComplete).length / list._count.items) * 100
              : 0
            return (
              <div
                key={list.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${selectedList?.id === list.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setSelectedList(list)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{list.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {list.items.filter((i) => i.isComplete).length}/{list._count.items} complete
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* List Detail */}
        <div className="lg:col-span-2">
          {!selectedList ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center h-64">
              <div className="text-center">
                <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a list to view</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedList.name}</h2>
                {selectedList.description && <p className="text-sm text-gray-500 mt-0.5">{selectedList.description}</p>}
                {totalCount > 0 && (
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    {completedCount} of {totalCount} completed
                  </p>
                )}
              </div>

              {/* Add Athlete */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAthleteId}
                  onChange={(e) => setNewAthleteId(e.target.value)}
                  placeholder="Athlete ID to add"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={addAthleteToList}
                  disabled={addingAthlete || !newAthleteId}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Items */}
              {selectedList.items.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No athletes added yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedList.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.isComplete ? 'bg-emerald-50' : 'bg-gray-50'}`}
                    >
                      <button
                        onClick={() => toggleItem(selectedList.id, item.id, item.isComplete)}
                        className={`flex-shrink-0 ${item.isComplete ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}`}
                      >
                        {item.isComplete ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.isComplete ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {item.athlete.user.name ?? item.athlete.user.email}
                        </p>
                        {item.notes && <p className="text-xs text-gray-400 truncate">{item.notes}</p>}
                        {item.isComplete && item.completedAt && (
                          <p className="text-xs text-emerald-500 mt-0.5">
                            Completed {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">New Tracking List</h2>
            <input
              type="text"
              value={newList.name}
              onChange={(e) => setNewList((f) => ({ ...f, name: e.target.value }))}
              placeholder="List name (e.g., Physicals Needed)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              value={newList.description}
              onChange={(e) => setNewList((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button
                onClick={() => createList()}
                disabled={creating || !newList.name}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                {creating ? 'Creating…' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
