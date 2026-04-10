'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Image, Video, File, Download, Search, Grid, List, ChevronDown } from 'lucide-react'

type DocumentType = 'FORM' | 'WAIVER' | 'PHOTO' | 'VIDEO' | 'REPORT' | 'OTHER'
type ViewMode = 'grid' | 'list'
type TabKey = 'team' | 'athlete' | 'photos'

interface Document {
  id: string
  name: string
  type: DocumentType
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  description: string | null
  createdAt: string
  isPublic: boolean
  uploader: { id: string; name: string | null } | null
  athlete?: { user: { name: string | null } } | null
}

const TYPE_ICONS: Record<DocumentType, React.FC<{ className?: string }>> = {
  FORM: FileText,
  WAIVER: FileText,
  PHOTO: Image,
  VIDEO: Video,
  REPORT: FileText,
  OTHER: File,
}

const TYPE_COLORS: Record<DocumentType, string> = {
  FORM: 'bg-blue-100 text-blue-700',
  WAIVER: 'bg-purple-100 text-purple-700',
  PHOTO: 'bg-pink-100 text-pink-700',
  VIDEO: 'bg-red-100 text-red-700',
  REPORT: 'bg-amber-100 text-amber-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'FORM', label: 'Form' },
  { value: 'WAIVER', label: 'Waiver' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' },
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<TabKey>('team')
  const [teamId, setTeamId] = useState('')
  const [athleteId, setAthleteId] = useState('')
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'FORM' as DocumentType, fileUrl: '', description: '', isPublic: false })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchDocs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab === 'team' || tab === 'photos') { if (teamId) params.set('teamId', teamId) }
      if (tab === 'athlete') { if (athleteId) params.set('athleteId', athleteId) }
      if (tab === 'photos') params.set('type', 'PHOTO')
      if (typeFilter && tab !== 'photos') params.set('type', typeFilter)

      const res = await fetch(`/api/documents?${params}`)
      if (res.ok) setDocs(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [tab, typeFilter])

  async function uploadDocument() {
    setUploading(true)
    try {
      const body: Record<string, unknown> = {
        name: uploadForm.name,
        type: uploadForm.type,
        fileUrl: uploadForm.fileUrl,
        description: uploadForm.description,
        isPublic: uploadForm.isPublic,
      }
      if (tab === 'team' || tab === 'photos') body.teamId = teamId
      if (tab === 'athlete') body.athleteId = athleteId

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowUpload(false)
        setUploadForm({ name: '', type: 'FORM', fileUrl: '', description: '', isPublic: false })
        fetchDocs()
      }
    } finally {
      setUploading(false)
    }
  }

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase()
    return !search || d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
  })

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'team', label: 'Team Documents' },
    { key: 'athlete', label: 'Athlete Documents' },
    { key: 'photos', label: 'Photos & Media' },
  ]

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents & Photos</h1>
          <p className="text-gray-500 mt-1">Waivers, forms, race photos — all in one place</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Context Input */}
      <div className="flex gap-3">
        {(tab === 'team' || tab === 'photos') && (
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="Team ID"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
        {tab === 'athlete' && (
          <input
            type="text"
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            placeholder="Athlete ID"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
        <button
          onClick={fetchDocs}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Load'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {tab !== 'photos' && (
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType | '')}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Types</option>
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {(['grid', 'list'] as const).map((mode) => {
            const Icon = mode === 'grid' ? Grid : List
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 ${viewMode === mode ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No documents found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((doc) => {
            const Icon = TYPE_ICONS[doc.type] ?? File
            return (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors group">
                <div className="flex items-center justify-center h-16 mb-3">
                  {doc.type === 'PHOTO' && doc.mimeType?.startsWith('image/') ? (
                    <img src={doc.fileUrl} alt={doc.name} className="h-16 w-full object-cover rounded-lg" />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${TYPE_COLORS[doc.type]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatBytes(doc.fileSize)}</p>
                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Uploaded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((doc) => {
                  const Icon = TYPE_ICONS[doc.type] ?? File
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[doc.type]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            {doc.description && <p className="text-xs text-gray-400 truncate max-w-xs">{doc.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[doc.type]}`}>{doc.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatBytes(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
            <input
              type="text"
              value={uploadForm.name}
              onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Document name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="relative">
              <select
                value={uploadForm.type}
                onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value as DocumentType }))}
                className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <input
              type="url"
              value={uploadForm.fileUrl}
              onChange={(e) => setUploadForm((f) => ({ ...f, fileUrl: e.target.value }))}
              placeholder="File URL (from Supabase Storage)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={uploadForm.isPublic}
                onChange={(e) => setUploadForm((f) => ({ ...f, isPublic: e.target.checked }))}
                className="rounded"
              />
              Make publicly accessible
            </label>
            <div className="flex gap-3">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button
                onClick={uploadDocument}
                disabled={uploading || !uploadForm.name || !uploadForm.fileUrl}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                {uploading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
