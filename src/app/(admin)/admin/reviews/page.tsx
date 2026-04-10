import { prisma } from '@/lib/prisma'
import AdminReviewList from './AdminReviewList'

async function getReviews() {
  try {
    return await prisma.review.findMany({
      orderBy: { submittedAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Reviews</h2>
        <p className="text-gray-500 mt-1">Approve or reject submitted reviews</p>
      </div>
      <AdminReviewList initialReviews={reviews} />
    </div>
  )
}
