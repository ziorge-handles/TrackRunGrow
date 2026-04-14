'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  TrendingUp,
  Trophy,
  Calendar,
  Zap,
  User,
  LogOut,
  Activity,
  BarChart2,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/portal', label: 'My Profile', icon: User, exact: true },
  { href: '/portal/races', label: 'My Races', icon: Trophy },
  { href: '/portal/performance', label: 'My Performance', icon: TrendingUp },
  { href: '/portal/workouts', label: 'My Workouts', icon: Activity },
  { href: '/portal/metrics', label: 'Body Metrics', icon: BarChart2 },
  { href: '/portal/calendar', label: 'Calendar', icon: Calendar },
]

export default function AthletePortalSidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-sm leading-none">TrackRunGrow</span>
          <p className="text-xs text-gray-400 mt-0.5">Athlete Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  active ? 'text-blue-600' : 'text-gray-400',
                )}
              />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Home className="w-4 h-4 text-gray-400" />
          Marketing site
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm w-full px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        <p className="text-xs text-gray-400 text-center pt-1">
          TrackRunGrow &copy; {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
