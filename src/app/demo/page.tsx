'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Trophy, TrendingUp, Calendar, Timer, Plus, Trash2,
  ArrowLeft, ChevronRight, Activity, Target, Zap, BarChart3
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DemoAthlete {
  id: string
  name: string
  events: string[]
  status: 'Active' | 'Injured' | 'Inactive'
  grade: string
}

interface DemoResult {
  id: string
  athleteId: string
  event: string
  time: number // seconds
  date: string
  meet: string
}

interface DemoWorkout {
  id: string
  athleteId: string
  type: string
  title: string
  distance: number
  date: string
  pace: string
}

interface DemoState {
  sport: 'XC' | 'TRACK'
  teamName: string
  athletes: DemoAthlete[]
  results: DemoResult[]
  workouts: DemoWorkout[]
}

// ─── Default demo data ─────────────────────────────────────────────────────────

const DEFAULT_STATE: DemoState = {
  sport: 'XC',
  teamName: 'My Team',
  athletes: [],
  results: [],
  workouts: [],
}

const XC_EVENTS = ['5K', '6K', '8K', '10K']
const TRACK_EVENTS = ['100m', '200m', '400m', '800m', '1500m', 'Mile', '3200m', '5000m', '110mH', '400mH', 'High Jump', 'Long Jump', 'Shot Put', 'Discus', 'Pole Vault', '4x100', '4x400']

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}:${secs.toFixed(2).padStart(5, '0')}`
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hrs}:${remainMins.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}`
}

// ─── Hook: localStorage state ──────────────────────────────────────────────────

function useDemoState(): [DemoState, (fn: (prev: DemoState) => DemoState) => void, () => void] {
  const [state, setState] = useState<DemoState>(DEFAULT_STATE)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trg-demo')
      if (saved) setState(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const update = useCallback((fn: (prev: DemoState) => DemoState) => {
    setState(prev => {
      const next = fn(prev)
      localStorage.setItem('trg-demo', JSON.stringify(next))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem('trg-demo')
    setState(DEFAULT_STATE)
  }, [])

  return [state, update, reset]
}

// ─── Main Demo Page ────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [state, update, reset] = useDemoState()
  const [activeTab, setActiveTab] = useState<'roster' | 'results' | 'workouts' | 'analytics'>('roster')
  const [showAddAthlete, setShowAddAthlete] = useState(false)
  const [showAddResult, setShowAddResult] = useState(false)
  const [showAddWorkout, setShowAddWorkout] = useState(false)

  const events = state.sport === 'XC' ? XC_EVENTS : TRACK_EVENTS

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-bold text-gray-900">
              <span className="text-blue-600">TRG</span> Interactive Demo
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Sport toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => update(s => ({ ...s, sport: 'XC' }))}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  state.sport === 'XC'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Cross Country
              </button>
              <button
                onClick={() => update(s => ({ ...s, sport: 'TRACK' }))}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  state.sport === 'TRACK'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Track &amp; Field
              </button>
            </div>
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Try TrackRunGrow — No Account Needed</h2>
              <p className="text-blue-100 text-sm">
                Add athletes, log results, track workouts. Everything saves to your browser.
                When you&apos;re ready, <Link href="/register" className="underline font-medium text-white">create an account</Link> for the full experience.
              </p>
            </div>
            <Zap className="w-10 h-10 text-blue-200 flex-shrink-0" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Athletes" value={state.athletes.length} color="blue" />
          <StatCard icon={Trophy} label="Race Results" value={state.results.length} color="green" />
          <StatCard icon={Activity} label="Workouts" value={state.workouts.length} color="purple" />
          <StatCard icon={Target} label="Mode" value={state.sport === 'XC' ? 'Cross Country' : 'Track & Field'} color="orange" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 mb-6">
          {(['roster', 'results', 'workouts', 'analytics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'roster' && (
          <RosterTab
            athletes={state.athletes}
            events={events}
            showAdd={showAddAthlete}
            setShowAdd={setShowAddAthlete}
            onAdd={(athlete) => update(s => ({ ...s, athletes: [...s.athletes, athlete] }))}
            onRemove={(id) => update(s => ({
              ...s,
              athletes: s.athletes.filter(a => a.id !== id),
              results: s.results.filter(r => r.athleteId !== id),
              workouts: s.workouts.filter(w => w.athleteId !== id),
            }))}
          />
        )}
        {activeTab === 'results' && (
          <ResultsTab
            results={state.results}
            athletes={state.athletes}
            events={events}
            showAdd={showAddResult}
            setShowAdd={setShowAddResult}
            onAdd={(result) => update(s => ({ ...s, results: [...s.results, result] }))}
            onRemove={(id) => update(s => ({ ...s, results: s.results.filter(r => r.id !== id) }))}
          />
        )}
        {activeTab === 'workouts' && (
          <WorkoutsTab
            workouts={state.workouts}
            athletes={state.athletes}
            showAdd={showAddWorkout}
            setShowAdd={setShowAddWorkout}
            onAdd={(workout) => update(s => ({ ...s, workouts: [...s.workouts, workout] }))}
            onRemove={(id) => update(s => ({ ...s, workouts: s.workouts.filter(w => w.id !== id) }))}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            athletes={state.athletes}
            results={state.results}
            workouts={state.workouts}
            sport={state.sport}
          />
        )}
      </div>

      {/* CTA footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Like what you see?</h3>
          <p className="text-gray-600 mb-4">Get the full experience with real-time data, AI coaching suggestions, and team collaboration.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Today <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Roster Tab ────────────────────────────────────────────────────────────────

function RosterTab({ athletes, events, showAdd, setShowAdd, onAdd, onRemove }: {
  athletes: DemoAthlete[]; events: string[]; showAdd: boolean; setShowAdd: (v: boolean) => void;
  onAdd: (a: DemoAthlete) => void; onRemove: (id: string) => void;
}) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('10th')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ id: generateId(), name: name.trim(), events: selectedEvents, status: 'Active', grade })
    setName(''); setSelectedEvents([]); setShowAdd(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Roster ({athletes.length})</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Athlete
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Athlete name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                {['9th', '10th', '11th', '12th'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
            <div className="flex flex-wrap gap-2">
              {events.map(event => (
                <button key={event} onClick={() => setSelectedEvents(prev =>
                  prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
                )}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedEvents.includes(event)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >{event}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
            <button onClick={() => setShowAdd(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      {athletes.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No athletes yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first athlete to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Events</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {athletes.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.grade}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.events.map(e => (
                        <span key={e} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{e}</span>
                      ))}
                      {a.events.length === 0 && <span className="text-xs text-gray-400">None</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onRemove(a.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Results Tab ───────────────────────────────────────────────────────────────

function ResultsTab({ results, athletes, events, showAdd, setShowAdd, onAdd, onRemove }: {
  results: DemoResult[]; athletes: DemoAthlete[]; events: string[]; showAdd: boolean;
  setShowAdd: (v: boolean) => void; onAdd: (r: DemoResult) => void; onRemove: (id: string) => void;
}) {
  const FIELD_EVENTS = ['High Jump', 'Long Jump', 'Triple Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin']
  const [athleteId, setAthleteId] = useState('')
  const [event, setEvent] = useState(events[0] || '')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [meet, setMeet] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fieldUnit, setFieldUnit] = useState<'m' | 'ft'>('m')
  const [metersVal, setMetersVal] = useState('')
  const [feetVal, setFeetVal] = useState('')
  const [inchesVal, setInchesVal] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const isField = FIELD_EVENTS.some(fe => event.toLowerCase().includes(fe.toLowerCase()))

  function metersToFtIn(m: number): string {
    const totalIn = m / 0.0254
    const ft = Math.floor(totalIn / 12)
    const inches = totalIn % 12
    return `${ft}'${inches.toFixed(1)}"`
  }

  const handleAdd = () => {
    if (!athleteId || !event) return
    setInputError(null)

    let resultValue: number

    if (isField) {
      if (fieldUnit === 'ft') {
        const ft = parseFloat(feetVal || '0')
        const inc = parseFloat(inchesVal || '0')
        if (inc >= 12) { setInputError('Inches must be less than 12'); return }
        resultValue = (ft + inc / 12) * 0.3048
      } else {
        resultValue = parseFloat(metersVal || '0')
      }
      if (resultValue <= 0) { setInputError('Distance must be positive'); return }
    } else {
      // Parse time input
      const timeStr = `${minutes || '0'}:${seconds || '0'}`
      const totalSecs = (parseFloat(minutes || '0') * 60) + parseFloat(seconds || '0')
      if (totalSecs <= 0) { setInputError('Time must be positive'); return }
      resultValue = totalSecs
    }

    onAdd({ id: generateId(), athleteId, event, time: resultValue, meet: meet || 'Practice', date })
    setMinutes(''); setSeconds(''); setMeet(''); setMetersVal(''); setFeetVal(''); setInchesVal(''); setShowAdd(false); setInputError(null)
  }

  const sorted = [...results].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Race Results ({results.length})</h3>
        <button onClick={() => setShowAdd(!showAdd)} disabled={athletes.length === 0}
          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Add Result
        </button>
      </div>

      {athletes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Add athletes to the roster first before logging results.
        </div>
      )}

      {showAdd && athletes.length > 0 && (
        <div className="bg-white rounded-lg border border-green-200 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Athlete</label>
              <select value={athleteId} onChange={e => setAthleteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                <option value="">Select...</option>
                {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select value={event} onChange={e => setEvent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
            <div>
              {isField ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                  <div className="space-y-2">
                    <div className="flex bg-gray-100 rounded-md p-0.5 w-fit">
                      <button type="button" onClick={() => setFieldUnit('m')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${fieldUnit === 'm' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Meters</button>
                      <button type="button" onClick={() => setFieldUnit('ft')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${fieldUnit === 'ft' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Ft &amp; In</button>
                    </div>
                    {fieldUnit === 'm' ? (
                      <input value={metersVal} onChange={e => setMetersVal(e.target.value)} placeholder="7.52" type="number" step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono" />
                    ) : (
                      <div className="flex gap-1 items-center">
                        <input value={feetVal} onChange={e => setFeetVal(e.target.value)} placeholder="24" type="number"
                          className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 text-center font-mono" />
                        <span className="text-gray-500 font-bold">&apos;</span>
                        <input value={inchesVal} onChange={e => setInchesVal(e.target.value)} placeholder="6.5" type="number" step="0.5"
                          className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 text-center font-mono" />
                        <span className="text-gray-500 font-bold">&quot;</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time (min:sec)</label>
                  <div className="flex gap-1 items-center">
                    <input value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="0" type="number"
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 text-center" />
                    <span className="text-gray-400">:</span>
                    <input value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="00.00" type="number" step="0.01"
                      className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 text-center" />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meet</label>
              <input value={meet} onChange={e => setMeet(e.target.value)} placeholder="Meet name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          </div>
          {inputError && (
            <p className="text-xs text-red-500">{inputError}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Save Result</button>
            <button onClick={() => setShowAdd(false)} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No results yet</p>
          <p className="text-sm text-gray-400 mt-1">Log your first race result</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Athlete</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Result</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Meet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(r => {
                const athlete = athletes.find(a => a.id === r.athleteId)
                const eventIsField = FIELD_EVENTS.some(fe => r.event.toLowerCase().includes(fe.toLowerCase()))
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{athlete?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{r.event}</span></td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {eventIsField
                        ? `${r.time.toFixed(2)}m (${metersToFtIn(r.time)})`
                        : formatTime(r.time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.meet}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.date}</td>
                    <td className="px-4 py-3"><button onClick={() => onRemove(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Workouts Tab ──────────────────────────────────────────────────────────────

function WorkoutsTab({ workouts, athletes, showAdd, setShowAdd, onAdd, onRemove }: {
  workouts: DemoWorkout[]; athletes: DemoAthlete[]; showAdd: boolean;
  setShowAdd: (v: boolean) => void; onAdd: (w: DemoWorkout) => void; onRemove: (id: string) => void;
}) {
  const [athleteId, setAthleteId] = useState('')
  const [type, setType] = useState('Easy Run')
  const [title, setTitle] = useState('')
  const [distance, setDistance] = useState('')
  const [pace, setPace] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const types = ['Easy Run', 'Tempo', 'Interval', 'Long Run', 'Recovery', 'Strength', 'Cross Training', 'Race']

  const handleAdd = () => {
    if (!athleteId || !title.trim()) return
    onAdd({ id: generateId(), athleteId, type, title: title.trim(), distance: parseFloat(distance || '0'), pace: pace || '-', date })
    setTitle(''); setDistance(''); setPace(''); setShowAdd(false)
  }

  const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const typeColors: Record<string, string> = {
    'Easy Run': 'bg-green-50 text-green-700',
    'Tempo': 'bg-orange-50 text-orange-700',
    'Interval': 'bg-red-50 text-red-700',
    'Long Run': 'bg-blue-50 text-blue-700',
    'Recovery': 'bg-teal-50 text-teal-700',
    'Strength': 'bg-purple-50 text-purple-700',
    'Cross Training': 'bg-yellow-50 text-yellow-700',
    'Race': 'bg-pink-50 text-pink-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Workout Log ({workouts.length})</h3>
        <button onClick={() => setShowAdd(!showAdd)} disabled={athletes.length === 0}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Log Workout
        </button>
      </div>

      {showAdd && athletes.length > 0 && (
        <div className="bg-white rounded-lg border border-purple-200 p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Athlete</label>
              <select value={athleteId} onChange={e => setAthleteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                <option value="">Select...</option>
                {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Workout title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (mi)</label>
              <input value={distance} onChange={e => setDistance(e.target.value)} placeholder="0.0" type="number" step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pace (/mi)</label>
              <input value={pace} onChange={e => setPace(e.target.value)} placeholder="7:30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Save Workout</button>
            <button onClick={() => setShowAdd(false)} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No workouts logged</p>
          <p className="text-sm text-gray-400 mt-1">Start tracking training</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(w => {
            const athlete = athletes.find(a => a.id === w.athleteId)
            return (
              <div key={w.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[w.type] || 'bg-gray-50 text-gray-700'}`}>{w.type}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{w.title}</p>
                    <p className="text-xs text-gray-500">{athlete?.name} &middot; {w.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {w.distance > 0 && <span className="text-sm text-gray-700 font-medium">{w.distance} mi</span>}
                  {w.pace !== '-' && <span className="text-sm text-gray-500">{w.pace}/mi</span>}
                  <button onClick={() => onRemove(w.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Analytics Tab ─────────────────────────────────────────────────────────────

function AnalyticsTab({ athletes, results, workouts, sport }: {
  athletes: DemoAthlete[]; results: DemoResult[]; workouts: DemoWorkout[]; sport: string;
}) {
  if (athletes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Add athletes and log results to see analytics</p>
      </div>
    )
  }

  // Personal bests per athlete
  const pbs: Record<string, Record<string, { time: number; date: string }>> = {}
  for (const r of results) {
    if (!pbs[r.athleteId]) pbs[r.athleteId] = {}
    if (!pbs[r.athleteId][r.event] || r.time < pbs[r.athleteId][r.event].time) {
      pbs[r.athleteId][r.event] = { time: r.time, date: r.date }
    }
  }

  // Total mileage per athlete
  const mileage: Record<string, number> = {}
  for (const w of workouts) {
    mileage[w.athleteId] = (mileage[w.athleteId] || 0) + w.distance
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Team Overview</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Athletes</span><span className="font-medium text-gray-900">{athletes.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total results</span><span className="font-medium text-gray-900">{results.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total workouts</span><span className="font-medium text-gray-900">{workouts.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Mode</span><span className="font-medium text-gray-900">{sport === 'XC' ? 'Cross Country' : 'Track & Field'}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Weekly Mileage</h4>
          </div>
          <div className="space-y-2 text-sm">
            {athletes.map(a => (
              <div key={a.id} className="flex justify-between">
                <span className="text-gray-500">{a.name}</span>
                <span className="font-medium text-gray-900">{(mileage[a.id] || 0).toFixed(1)} mi</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Recent Activity</h4>
          </div>
          <div className="space-y-2 text-sm">
            {[...results, ...workouts.map(w => ({ ...w, time: 0, event: w.type, meet: w.title }))]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((item, i) => {
                const athlete = athletes.find(a => a.id === item.athleteId)
                return (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500 truncate">{athlete?.name}</span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                )
              })}
            {results.length === 0 && workouts.length === 0 && (
              <p className="text-gray-400 text-xs">No activity yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Personal Bests
        </h4>
        {Object.keys(pbs).length === 0 ? (
          <p className="text-sm text-gray-400">Log race results to see personal bests here.</p>
        ) : (
          <div className="space-y-4">
            {athletes.filter(a => pbs[a.id]).map(a => (
              <div key={a.id}>
                <p className="text-sm font-medium text-gray-900 mb-2">{a.name}</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(pbs[a.id]).map(([event, pb]) => (
                    <div key={event} className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-yellow-600 font-medium">{event}</p>
                      <p className="text-sm font-bold text-gray-900 font-mono">{formatTime(pb.time)}</p>
                      <p className="text-xs text-gray-400">{pb.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note about full version */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <h4 className="font-semibold text-gray-900 mb-1">Want more insights?</h4>
        <p className="text-sm text-gray-600">
          The full TrackRunGrow platform includes trend projections, season comparisons, AI-powered workout suggestions, body metrics tracking, and much more.
        </p>
        <Link href="/register" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">
          Start Today <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
