import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AthletePortalSidebar from './AthletePortalSidebar'

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ATHLETE') {
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    }
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AthletePortalSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Athlete Portal</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
              {session.user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
