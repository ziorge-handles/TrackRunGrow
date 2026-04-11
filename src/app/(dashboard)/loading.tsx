export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-sm text-gray-400 font-medium">Loading...</p>
    </div>
  )
}
