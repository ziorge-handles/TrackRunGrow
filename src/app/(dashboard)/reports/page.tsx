'use client'

import { useState } from 'react'
import { ClipboardList, Plus, Calendar, User, FileText } from 'lucide-react'

interface Report {
  id: string
  title: string
  reportDate: string
  content: string
  athleteIds: string[]
  createdAt: string
  author: { id: string; name: string | null } | null
}

export default function ReportsPage() {
  const [teamId, setTeamId] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    reportDate: new Date().toISOString().slice(0, 10),
    content: '',
    athleteIds: '',
  })

  async function fetchReports() {
    if (!teamId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/trainer-reports?teamId=${teamId}`)
      if (res.ok) setReports(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function createReport() {
    if (!form.title || !form.content || !teamId) return
    setCreating(true)
    try {
      const athleteIds = form.athleteIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const res = await fetch('/api/trainer-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          title: form.title,
          reportDate: form.reportDate,
          content: form.content,
          athleteIds,
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setForm({ title: '', reportDate: new Date().toISOString().slice(0, 10), content: '', athleteIds: '' })
        fetchReports()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Reports</h1>
          <p className="text-gray-500 mt-1">Activity reports and athlete notes</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          New Report
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
        <button onClick={fetchReports} disabled={!teamId || loading} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          {loading ? '…' : 'Load'}
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">New Trainer Report</h2>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Report title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="date"
              value={form.reportDate}
              onChange={(e) => setForm((f) => ({ ...f, reportDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write your report here…"
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <input
              type="text"
              value={form.athleteIds}
              onChange={(e) => setForm((f) => ({ ...f, athleteIds: e.target.value }))}
              placeholder="Athlete IDs (comma separated, optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button
                onClick={createReport}
                disabled={creating || !form.title || !form.content}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                {creating ? 'Saving…' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List */}
        <div className="lg:col-span-1 space-y-2">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reports yet</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setSelectedReport(report)}
              >
                <p className="font-medium text-gray-900 text-sm line-clamp-1">{report.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.reportDate).toLocaleDateString()}
                  </span>
                  {report.author?.name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {report.author.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{report.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-2">
          {!selectedReport ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a report to read</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedReport.title}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedReport.reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {selectedReport.author?.name && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {selectedReport.author.name}
                    </span>
                  )}
                  {selectedReport.athleteIds.length > 0 && (
                    <span className="text-emerald-600 font-medium">
                      {selectedReport.athleteIds.length} athlete{selectedReport.athleteIds.length !== 1 ? 's' : ''} mentioned
                    </span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedReport.content}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
