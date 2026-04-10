'use client'

import { useState } from 'react'
import { Star, CheckCircle, XCircle } from 'lucide-react'

interface Review {
  id: string
  authorName: string
  authorRole: string
  authorOrg: string | null
  rating: number
  title: string
  body: string
  status: string
  submittedAt: Date
}

export default function AdminReviewList({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(reviewId: string, action: 'APPROVED' | 'REJECTED') {
    setLoading(reviewId)
    try {
      const res = await fetch('/api/reviews/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status: action }),
      })
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status: action } : r)),
        )
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(null)
    }
  }

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {reviews.length} reviews total, {pendingCount} pending
      </p>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      review.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : review.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900">{review.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{review.body}</p>
                  <div className="mt-3 text-xs text-gray-400">
                    {review.authorName} &middot; {review.authorRole}
                    {review.authorOrg ? ` &middot; ${review.authorOrg}` : ''} &middot;{' '}
                    {new Date(review.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                {review.status === 'PENDING' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(review.id, 'APPROVED')}
                      disabled={loading === review.id}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(review.id, 'REJECTED')}
                      disabled={loading === review.id}
                      className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
