'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import { Brain, Loader2, Send, CheckCircle, XCircle } from 'lucide-react'

interface PastSuggestion {
  id: string
  weekOf: string | null
  response: string
  accepted: boolean
  dismissed: boolean
  createdAt: string
}

const FOCUS_OPTIONS = [
  { value: 'speed', label: 'Speed' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'strength', label: 'Strength' },
  { value: 'race_prep', label: 'Race Prep' },
  { value: 'base_building', label: 'Base Building' },
]

export default function AthleteAiPage() {
  const params = useParams()
  const athleteId = params.athleteId as string

  const [weekOf, setWeekOf] = useState(() => {
    const d = new Date()
    // Next Monday
    const day = d.getDay()
    const diff = day === 0 ? 1 : 8 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  })
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pastSuggestions, setPastSuggestions] = useState<PastSuggestion[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch past suggestions (would need an endpoint; skip for now with empty array)
    setPastSuggestions([])
  }, [athleteId])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [streamContent])

  const toggleFocus = (value: string) => {
    setFocusAreas((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    )
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setStreamContent('')
    setError(null)

    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, weekOf, focusAreas }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to generate plan')
        return
      }

      if (!res.body) {
        setError('No response body')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setStreamContent((prev) => prev + text)
      }
    } catch {
      setError('Something went wrong generating the plan.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-violet-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Training Plans</h2>
      </div>

      {/* Generator Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generate 7-Day Training Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week Starting
            </label>
            <input
              type="date"
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
              className="block w-full sm:w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Areas
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleFocus(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    focusAreas.includes(value)
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Streaming Response */}
      {(streamContent || generating) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-600" />
              Generated Training Plan
              {generating && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={contentRef}
              className="max-h-[600px] overflow-y-auto prose prose-sm prose-gray max-w-none"
            >
              <ReactMarkdown>{streamContent}</ReactMarkdown>
              {generating && (
                <span className="inline-block w-2 h-4 bg-violet-600 animate-pulse ml-1" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Suggestions */}
      {pastSuggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Past Plans</h3>
          {pastSuggestions.map((suggestion) => (
            <Card key={suggestion.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Week of {suggestion.weekOf ? new Date(suggestion.weekOf).toLocaleDateString() : 'Unknown'}
                    </span>
                    {suggestion.accepted && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accepted
                      </span>
                    )}
                    {suggestion.dismissed && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Dismissed
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === suggestion.id ? null : suggestion.id)}
                  >
                    {expandedId === suggestion.id ? 'Collapse' : 'View'}
                  </Button>
                </div>

                {expandedId === suggestion.id && (
                  <div className="prose prose-sm prose-gray max-w-none mt-3 pt-3 border-t border-gray-100">
                    <ReactMarkdown>{suggestion.response}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
