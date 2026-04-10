'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, ClipboardPaste, CheckCircle } from 'lucide-react'
import { parseTimeToSeconds, parseDistanceToMeters, metersToFeetInches } from '@/lib/validations'

interface Athlete {
  id: string
  user: { name: string | null }
}

interface TrackEvent {
  id: string
  name: string
  lowerIsBetter: boolean
  unitLabel: string
  isFieldEvent: boolean
}

interface RaceInfo {
  id: string
  name: string
  sport: string
}

interface ApiRaceResult {
  athleteId: string
  resultValue: number
  place: number | null
  trackEventId: string | null
  dnf: boolean
  dns: boolean
  athlete: Athlete
  trackEvent?: TrackEvent | null
}

interface ResultRow {
  athleteId: string
  athleteName: string
  resultValue: string
  resultParsed: number | null
  place: string
  trackEventId: string
  dnf: boolean
  dns: boolean
  unit: 'm' | 'ft'
  feetValue: string
  inchesValue: string
  error: string | null
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

function createEmptyRow(): ResultRow {
  return {
    athleteId: '',
    athleteName: '',
    resultValue: '',
    resultParsed: null,
    place: '',
    trackEventId: '',
    dnf: false,
    dns: false,
    unit: 'm',
    feetValue: '',
    inchesValue: '',
    error: null,
  }
}

export default function ResultEntryPage() {
  const params = useParams()
  const router = useRouter()
  const raceId = params.raceId as string

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [trackEvents, setTrackEvents] = useState<TrackEvent[]>([])
  const [rows, setRows] = useState<ResultRow[]>([])
  const [pasteText, setPasteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPRs, setNewPRs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch race info
    fetch(`/api/races/${raceId}`)
      .then((r) => r.json())
      .then((data: { race: RaceInfo & { results: ApiRaceResult[] } }) => {
        setRace(data.race)
        const uniqueAthletes = [
          ...new Map(
            data.race.results.map((r) => [r.athlete.id, r.athlete]),
          ).values(),
        ]
        setAthletes(uniqueAthletes)
        setRows(
          data.race.results.map((r) => ({
            athleteId: r.athleteId,
            athleteName: r.athlete.user.name ?? '',
            resultValue: r.resultValue.toString(),
            resultParsed: r.resultValue,
            place: (r.place ?? '').toString(),
            trackEventId: r.trackEventId ?? '',
            dnf: r.dnf ?? false,
            dns: r.dns ?? false,
            unit: 'm' as const,
            feetValue: '',
            inchesValue: '',
            error: null,
          })),
        )
      })
      .catch(console.error)

    // Fetch track events for TRACK sport
    fetch('/api/track-events')
      .then((r) => r.json())
      .then((data: { trackEvents?: TrackEvent[] }) => {
        if (data.trackEvents) setTrackEvents(data.trackEvents)
      })
      .catch(console.error)
  }, [raceId])

  const getSelectedEvent = (trackEventId: string): TrackEvent | undefined => {
    return trackEvents.find((te) => te.id === trackEventId)
  }

  const isRowFieldEvent = (row: ResultRow): boolean => {
    const ev = getSelectedEvent(row.trackEventId)
    return ev?.isFieldEvent ?? false
  }

  const updateRow = (
    index: number,
    field: keyof ResultRow,
    value: string | boolean | number | null,
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  const parseAndSetTimeValue = (index: number, raw: string) => {
    if (!raw.trim()) {
      updateRow(index, 'resultValue', '')
      updateRow(index, 'resultParsed', null)
      updateRow(index, 'error', null)
      return
    }
    const secs = parseTimeToSeconds(raw)
    if (secs !== null && secs >= 5 && secs <= 7200) {
      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, resultValue: raw, resultParsed: secs, error: null }
            : row,
        ),
      )
    } else if (secs !== null) {
      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                resultValue: raw,
                resultParsed: null,
                error: 'Time must be between 5 seconds and 2 hours',
              }
            : row,
        ),
      )
    } else {
      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                resultValue: raw,
                resultParsed: null,
                error: 'Invalid time format. Use M:SS.xx or raw seconds',
              }
            : row,
        ),
      )
    }
  }

  const parseAndSetFieldValue = (index: number, row: ResultRow) => {
    if (row.unit === 'ft') {
      const feet = parseFloat(row.feetValue || '0')
      const inches = parseFloat(row.inchesValue || '0')
      if (inches >= 12) {
        updateRow(index, 'error', 'Inches must be less than 12')
        updateRow(index, 'resultParsed', null)
        return
      }
      if (feet <= 0 && inches <= 0) {
        updateRow(index, 'resultParsed', null)
        updateRow(index, 'error', null)
        return
      }
      const meters = (feet + inches / 12) * 0.3048
      setRows((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                resultParsed: meters,
                resultValue: meters.toFixed(2),
                error: null,
              }
            : r,
        ),
      )
    } else {
      const raw = row.resultValue.trim()
      if (!raw) {
        updateRow(index, 'resultParsed', null)
        updateRow(index, 'error', null)
        return
      }
      const meters = parseDistanceToMeters(raw)
      if (meters !== null) {
        setRows((prev) =>
          prev.map((r, i) =>
            i === index ? { ...r, resultParsed: meters, error: null } : r,
          ),
        )
      } else {
        setRows((prev) =>
          prev.map((r, i) =>
            i === index
              ? {
                  ...r,
                  resultParsed: null,
                  error: 'Invalid distance. Use meters (e.g. 7.52) or feet\'inches (e.g. 24\'6")',
                }
              : r,
          ),
        )
      }
    }
  }

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()])
  }

  const parsePaste = () => {
    const lines = pasteText
      .trim()
      .split('\n')
      .filter(Boolean)
    const parsed: ResultRow[] = lines.map((line, i) => {
      const cols = line.split('\t')
      const raw = cols[2]?.trim() ?? ''
      const timeSecs = parseTimeToSeconds(raw)
      const distMeters = parseDistanceToMeters(raw)

      return {
        athleteId: '',
        athleteName: cols[0]?.trim() ?? '',
        place: cols[1]?.trim() ?? (i + 1).toString(),
        resultValue: raw,
        resultParsed: timeSecs ?? distMeters ?? null,
        trackEventId: '',
        dnf: false,
        dns: false,
        unit: 'm' as const,
        feetValue: '',
        inchesValue: '',
        error: raw && !timeSecs && !distMeters ? 'Could not parse value' : null,
      }
    })
    setRows(parsed)
    setPasteText('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const validRows = rows.filter(
      (r) => r.athleteId && (r.resultParsed || r.dnf || r.dns),
    )

    if (validRows.length === 0) {
      setError(
        'No valid results to save. Make sure athletes are selected and results are entered.',
      )
      setSaving(false)
      return
    }

    // Check for parsing errors
    const rowsWithErrors = validRows.filter((r) => r.error && !r.dnf && !r.dns)
    if (rowsWithErrors.length > 0) {
      setError('Some rows have input errors. Please fix them before saving.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/races/${raceId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: validRows.map((r) => ({
            athleteId: r.athleteId,
            resultValue: r.resultParsed ?? 0,
            place: r.place ? parseInt(r.place) : undefined,
            trackEventId: r.trackEventId || undefined,
            dnf: r.dnf,
            dns: r.dns,
          })),
        }),
      })

      const data = (await res.json()) as {
        saved?: number
        newPRs?: string[]
        error?: string
        details?: unknown
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to save results')
      } else {
        setSaved(true)
        setNewPRs(data.newPRs ?? [])
        setTimeout(() => router.push(`/dashboard/races/${raceId}`), 3000)
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Results Saved!
        </h2>
        {newPRs.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <p className="font-semibold text-amber-800 mb-2">New PRs!</p>
            {newPRs.map((pr) => (
              <p key={pr} className="text-sm text-amber-700">
                {pr}
              </p>
            ))}
          </div>
        )}
        <p className="text-gray-500 mt-4">Redirecting back to race...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/races/${raceId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Race
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enter Results</h1>
        {race && (
          <p className="text-sm text-gray-500 mt-1">{race.name}</p>
        )}
      </div>

      {/* Paste Import */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4" />
            Paste from Spreadsheet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">
            Paste tab-separated values with columns: Athlete Name | Place |
            Result (time as M:SS.xx, or distance in meters/feet)
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"John Smith\t1\t15:42.5\nJane Doe\t2\t15:58.1"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={parsePaste}
            disabled={!pasteText.trim()}
          >
            Parse Rows
          </Button>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Results Entry</CardTitle>
            <Badge variant="outline">{rows.length} rows</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                    Athlete
                  </th>
                  {race?.sport === 'TRACK' && (
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      Event
                    </th>
                  )}
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                    Result
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                    Place
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                    DNF/DNS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => {
                  const isField = isRowFieldEvent(row)

                  return (
                    <tr
                      key={i}
                      className={row.dnf || row.dns ? 'opacity-60' : ''}
                    >
                      <td className="px-4 py-2">
                        <select
                          value={row.athleteId}
                          onChange={(e) =>
                            updateRow(i, 'athleteId', e.target.value)
                          }
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">
                            {row.athleteName || 'Select athlete...'}
                          </option>
                          {athletes.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.user.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      {race?.sport === 'TRACK' && (
                        <td className="px-4 py-2">
                          <select
                            value={row.trackEventId}
                            onChange={(e) =>
                              updateRow(i, 'trackEventId', e.target.value)
                            }
                            className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="">Select event</option>
                            {trackEvents.map((te) => (
                              <option key={te.id} value={te.id}>
                                {te.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="px-4 py-2">
                        {row.dnf || row.dns ? (
                          <span className="text-sm text-gray-400 italic">
                            {row.dnf ? 'DNF' : 'DNS'}
                          </span>
                        ) : isField ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex bg-gray-100 rounded-md p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateRow(i, 'unit', 'm')}
                                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                                    row.unit === 'm'
                                      ? 'bg-white text-emerald-700 shadow-sm'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  Meters
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateRow(i, 'unit', 'ft')}
                                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                                    row.unit === 'ft'
                                      ? 'bg-white text-emerald-700 shadow-sm'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  Ft &amp; In
                                </button>
                              </div>
                              {row.unit === 'm' ? (
                                <Input
                                  value={row.resultValue}
                                  onChange={(e) =>
                                    updateRow(i, 'resultValue', e.target.value)
                                  }
                                  onBlur={() => parseAndSetFieldValue(i, row)}
                                  placeholder="7.52"
                                  className="h-8 w-24 text-sm font-mono"
                                />
                              ) : (
                                <div className="flex gap-1 items-center">
                                  <Input
                                    value={row.feetValue}
                                    onChange={(e) =>
                                      updateRow(i, 'feetValue', e.target.value)
                                    }
                                    onBlur={() =>
                                      parseAndSetFieldValue(i, {
                                        ...row,
                                        feetValue:
                                          rows[i].feetValue,
                                        inchesValue:
                                          rows[i].inchesValue,
                                      })
                                    }
                                    placeholder="24"
                                    type="number"
                                    className="h-8 w-16 text-sm font-mono"
                                  />
                                  <span className="text-gray-500 font-bold">
                                    &apos;
                                  </span>
                                  <Input
                                    value={row.inchesValue}
                                    onChange={(e) =>
                                      updateRow(
                                        i,
                                        'inchesValue',
                                        e.target.value,
                                      )
                                    }
                                    onBlur={() =>
                                      parseAndSetFieldValue(i, {
                                        ...row,
                                        feetValue:
                                          rows[i].feetValue,
                                        inchesValue:
                                          rows[i].inchesValue,
                                      })
                                    }
                                    placeholder="6.5"
                                    type="number"
                                    step="0.5"
                                    className="h-8 w-16 text-sm font-mono"
                                  />
                                  <span className="text-gray-500 font-bold">
                                    &quot;
                                  </span>
                                </div>
                              )}
                            </div>
                            {row.resultParsed && (
                              <p className="text-xs text-gray-400">
                                = {row.resultParsed.toFixed(2)}m (
                                {metersToFeetInches(row.resultParsed)})
                              </p>
                            )}
                            {row.error && (
                              <p className="text-xs text-red-500">
                                {row.error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input
                              value={row.resultValue}
                              onChange={(e) =>
                                updateRow(i, 'resultValue', e.target.value)
                              }
                              onBlur={(e) =>
                                parseAndSetTimeValue(i, e.target.value)
                              }
                              placeholder={
                                race?.sport === 'XC'
                                  ? 'e.g. 15:42.30'
                                  : 'e.g. 5:42.30'
                              }
                              className="h-8 text-sm font-mono"
                            />
                            <p className="text-xs text-gray-400">
                              Enter time as M:SS.xx or raw seconds
                            </p>
                            {row.resultParsed && (
                              <p className="text-xs text-emerald-600">
                                Parsed: {formatTime(row.resultParsed)}
                              </p>
                            )}
                            {row.error && (
                              <p className="text-xs text-red-500">
                                {row.error}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={row.place}
                          onChange={(e) =>
                            updateRow(i, 'place', e.target.value)
                          }
                          placeholder="#"
                          className="h-8 w-16 text-sm"
                          type="number"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={row.dnf}
                              onChange={(e) =>
                                updateRow(i, 'dnf', e.target.checked)
                              }
                            />
                            DNF
                          </label>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={row.dns}
                              onChange={(e) =>
                                updateRow(i, 'dns', e.target.checked)
                              }
                            />
                            DNS
                          </label>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={addRow}>
              + Add Row
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/dashboard/races/${raceId}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Results
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
