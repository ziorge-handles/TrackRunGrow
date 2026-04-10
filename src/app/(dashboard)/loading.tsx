export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-300">
      <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6" style={{ animationDelay: `${i * 75}ms` }}>
            <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" style={{ animationDelay: `${i * 75}ms` }} />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 75 + 50}ms` }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-12 w-full bg-gray-100 rounded-lg mb-2 animate-pulse" style={{ animationDelay: `${j * 100}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
