import { Skeleton } from '@/components/ui/skeleton'

export default function AthleteLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full mb-2" />)}
      </div>
    </div>
  )
}
