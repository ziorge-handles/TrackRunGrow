'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, ChevronDown, BookOpen, ChevronRight } from 'lucide-react'

const IMPORT_TYPES = [
  { value: 'race_results', label: 'Race Results' },
  { value: 'athletes', label: 'Athletes / Roster' },
  { value: 'workouts', label: 'Workout Logs' },
  { value: 'qualifying_marks', label: 'Qualifying Marks' },
]

const EXPORT_TYPES = [
  { value: 'athletes', label: 'Athletes (Full Roster)' },
  { value: 'race_results', label: 'Race Results' },
  { value: 'workouts', label: 'Workout Logs' },
  { value: 'personal_bests', label: 'Personal Bests' },
  { value: 'meet_lineup', label: 'Meet Lineup' },
]

interface ImportError {
  row: number
  message: string
}

interface PreviewRow {
  [key: string]: string
}

function parseCsvPreview(text: string): PreviewRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1, 6).map((line) => {
    const vals = line.split(',')
    const row: PreviewRow = {}
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim() })
    return row
  })
}

export default function ImportExportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importType, setImportType] = useState('race_results')
  const [teamId, setTeamId] = useState('')
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; errors: ImportError[] } | null>(null)

  const [exportType, setExportType] = useState('athletes')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportTeamId, setExportTeamId] = useState('')

  const handleFile = useCallback(async (file: File) => {
    setSelectedFile(file)
    setImportResult(null)
    if (file.name.endsWith('.csv')) {
      const text = await file.text()
      setPreview(parseCsvPreview(text))
    } else if (file.name.endsWith('.json')) {
      try {
        const text = await file.text()
        const json = JSON.parse(text)
        setPreview(Array.isArray(json) ? json.slice(0, 5) : [])
      } catch {
        setPreview([])
      }
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  async function handleImport() {
    if (!selectedFile || !teamId) return
    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('type', importType)
      fd.append('teamId', teamId)
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      setImportResult(data)
    } catch {
      setImportResult({ imported: 0, errors: [{ row: 0, message: 'Network error' }] })
    } finally {
      setImporting(false)
    }
  }

  function handleExport() {
    if (!exportTeamId) return
    const params = new URLSearchParams({ type: exportType, teamId: exportTeamId, format: exportFormat })
    window.location.href = `/api/export?${params.toString()}`
  }

  const previewHeaders = preview.length > 0 ? Object.keys(preview[0]) : []

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import & Export</h1>
        <p className="text-gray-500 mt-1">Import data from timing systems or export for reporting</p>
      </div>

      {/* Quick Start Guide */}
      <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Quick Start Guide
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              How to Import
            </h3>
            <ol className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center mt-0.5">1</span>
                <span><strong>Select your import type</strong> &mdash; choose Race Results, Athletes, Workout Logs, or Qualifying Marks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center mt-0.5">2</span>
                <span><strong>Enter your Team ID</strong> &mdash; find it on your Team page under team details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center mt-0.5">3</span>
                <span><strong>Upload a CSV or JSON file</strong> &mdash; drag and drop or click to browse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center mt-0.5">4</span>
                <span><strong>Preview and confirm</strong> &mdash; review the preview table, then click Import</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-600" />
              How to Export
            </h3>
            <ol className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">1</span>
                <span><strong>Choose what to export</strong> &mdash; Athletes, Race Results, Workouts, Personal Bests, or Lineups</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">2</span>
                <span><strong>Pick a format</strong> &mdash; CSV for spreadsheets (Excel, Google Sheets) or JSON for APIs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">3</span>
                <span><strong>Enter your Team ID</strong> and click Download</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-white/60 border border-emerald-100 rounded-lg p-4 mt-2">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">CSV Format Tips</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Race Results:</strong> athleteName, email, time, place, eventName</span>
            </div>
            <div className="flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Athletes:</strong> name, email, graduationYear, gender, jerseyNumber</span>
            </div>
            <div className="flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Workouts:</strong> athleteEmail, date, type, title, distanceMiles, durationMin</span>
            </div>
            <div className="flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span><strong>Qualifying Marks:</strong> athleteEmail, eventName, mark, date</span>
            </div>
          </div>
        </div>
      </section>

      {/* Import Section */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-600" />
          Import Data
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Import Type</label>
            <div className="relative">
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {IMPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Enter your team ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">Drag & drop a CSV or JSON file, or <span className="text-emerald-600 font-medium">browse</span></p>
              <p className="text-xs text-gray-400 mt-1">Supports .csv and .json formats</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Preview Table */}
        {preview.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Preview (first {preview.length} rows)</p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {previewHeaders.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {previewHeaders.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-700 max-w-xs truncate">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!selectedFile || !teamId || importing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Importing…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import Data
            </>
          )}
        </button>

        {/* Results */}
        {importResult && (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${importResult.imported > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
              <CheckCircle className="w-4 h-4" />
              {importResult.imported} record{importResult.imported !== 1 ? 's' : ''} imported successfully
            </div>
            {importResult.errors.length > 0 && (
              <div className="space-y-1">
                {importResult.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Row {err.row}:</strong> {err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Export Section */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          Export Data
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Export Type</label>
            <div className="relative">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <div className="relative">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
            <input
              type="text"
              value={exportTeamId}
              onChange={(e) => setExportTeamId(e.target.value)}
              placeholder="Enter your team ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={!exportTeamId}
          className="w-full sm:w-auto flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Download {exportFormat.toUpperCase()}
        </button>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
          <strong>CSV format</strong> — compatible with Excel, Google Sheets, and timing software.{' '}
          <strong>JSON format</strong> — structured data for developers and API integrations.
        </div>
      </section>
    </div>
  )
}
