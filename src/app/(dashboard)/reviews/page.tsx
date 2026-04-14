'use client'

import { useState, useEffect } from 'react'
import { Star, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

interface Review {
  id: string
  authorName: string
  authorRole: string
  authorOrg: string | null
  rating: number
  title: string
  body: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  approvedAt: string | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review, onApprove, onReject }: {
  review: Review
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
}) {
  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{review.authorName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[review.status]}`}>
              {review.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {review.authorRole}{review.authorOrg ? ` — ${review.authorOrg}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <StarRating rating={review.rating} />
          <p className="text-xs text-gray-400 mt-1">{new Date(review.submittedAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div>
        <p className="font-semibold text-gray-800">{review.title}</p>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.body}</p>
      </div>
      {(onApprove || onReject) && review.status === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          {onApprove && (
            <button
              onClick={() => onApprove(review.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(review.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews/all')
      if (res.ok) setReviews(await res.json())
    } catch {
      // try public endpoint fallback
      const res = await fetch('/api/reviews')
      if (res.ok) setReviews(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  async function moderateReview(reviewId: string, action: 'approve' | 'reject') {
    const res = await fetch('/api/reviews/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action }),
    })
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : r,
        ),
      )
    }
  }

  const filtered = filter === 'ALL' ? reviews : reviews.filter((r) => r.status === filter)
  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length
  const approvedCount = reviews.filter((r) => r.status === 'APPROVED').length

  return (
    <div className="space-y-6 px-4 py-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-500 mt-1">Approve or reject user reviews before they appear publicly</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-sm text-amber-600 mt-0.5">Pending</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
          <p className="text-sm text-emerald-600 mt-0.5">Approved</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{reviews.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            {f === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Review List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No {filter === 'ALL' ? '' : filter.toLowerCase()} reviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={review.status === 'PENDING' ? (id) => moderateReview(id, 'approve') : undefined}
              onReject={review.status === 'PENDING' ? (id) => moderateReview(id, 'reject') : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
