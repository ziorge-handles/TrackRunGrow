'use client'

import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'

export default function ReviewForm() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [form, setForm] = useState({
    authorName: '',
    authorRole: '',
    authorOrg: '',
    title: '',
    body: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    if (!form.authorName || !form.authorRole || !form.title || !form.body) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-emerald-800">Thank you for your review!</h3>
        <p className="text-emerald-600 mt-2">Thank you! Your review will appear after approval.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name *</label>
          <input
            type="text"
            value={form.authorName}
            onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
            placeholder="Coach Jane Smith"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
          <input
            type="text"
            value={form.authorRole}
            onChange={(e) => setForm((f) => ({ ...f, authorRole: e.target.value }))}
            placeholder="Head XC Coach"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">School / Club (optional)</label>
        <input
          type="text"
          value={form.authorOrg}
          onChange={(e) => setForm((f) => ({ ...f, authorOrg: e.target.value }))}
          placeholder="Lincoln High School"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Review Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Best coaching tool I've used"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Review *</label>
        <textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="Share your experience with TrackRunGrow…"
          rows={5}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
          required
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Reviews are moderated before appearing publicly. We appreciate honest, genuine feedback.
      </p>
    </form>
  )
}
