'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, User, Trophy, Activity, Calendar, Settings, Zap,
  AlignJustify, X, CalendarCheck, MessageSquare, DollarSign, FileText,
  Tag, ClipboardList, ArrowDownUp, Lock, Star, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import SportToggle from './SportToggle'

interface NavItem {
  href: string
  label: string
  icon: React.FC<{ className?: string }>
  exact?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Coaching',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/teams', label: 'Teams', icon: Users },
      { href: '/athletes', label: 'Athletes', icon: User },
      { href: '/races', label: 'Races', icon: Trophy },
      { href: '/lineups', label: 'Lineups', icon: ListChecks },
      { href: '/workouts', label: 'Workouts', icon: Activity },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
    ],
  },
  {
    title: 'Communication',
    items: [
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/fees', label: 'Fees', icon: DollarSign },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/tracking', label: 'Tracking Lists', icon: Tag },
      { href: '/reports', label: 'Reports', icon: ClipboardList },
      { href: '/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    title: 'Data',
    items: [
      { href: '/import-export', label: 'Import / Export', icon: ArrowDownUp },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/settings/security', label: 'Security & MFA', icon: Lock },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-gray-900 leading-none">TrackRunGrow</span>
          <p className="text-xs text-gray-400 mt-0.5">Coach Dashboard</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sport Toggle */}
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">Sport Mode</p>
        <SportToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-3">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href, link.exact)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]',
                      active
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900',
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
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          TrackRunGrow &copy; {new Date().getFullYear()}
        </p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm"
        aria-label="Open navigation"
      >
        <AlignJustify className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar (slide in from left) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-200 transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 flex-shrink-0">
        <NavContent />
      </aside>
    </>
  )
}
