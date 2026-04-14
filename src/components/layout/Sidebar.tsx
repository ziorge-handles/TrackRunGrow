'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, User, Trophy, Activity, Calendar, Settings, Zap,
  AlignJustify, X, CalendarCheck, MessageSquare, DollarSign, FileText,
  Tag, ClipboardList, ArrowDownUp, Lock, ListChecks, ChevronDown, ChevronRight,
  Shield, Home,
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
  key: string
  title: string
  items: NavItem[]
  defaultOpen?: boolean
}

const navSections: NavSection[] = [
  {
    key: 'main',
    title: 'Main',
    defaultOpen: true,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    key: 'coaching',
    title: 'Coaching',
    defaultOpen: true,
    items: [
      { href: '/teams', label: 'Teams', icon: Users },
      { href: '/athletes', label: 'Athletes', icon: User },
      { href: '/races', label: 'Races', icon: Trophy },
      { href: '/workouts', label: 'Workouts', icon: Activity },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    key: 'performance',
    title: 'Performance',
    defaultOpen: true,
    items: [
      { href: '/lineups', label: 'Lineups', icon: ListChecks },
      { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
      { href: '/tracking', label: 'Tracking', icon: Tag },
    ],
  },
  {
    key: 'communication',
    title: 'Communication',
    items: [
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    key: 'management',
    title: 'Management',
    items: [
      { href: '/fees', label: 'Fees', icon: DollarSign },
      { href: '/documents', label: 'Documents', icon: FileText },
      { href: '/import-export', label: 'Import / Export', icon: ArrowDownUp },
      { href: '/reports', label: 'Reports', icon: ClipboardList },
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/settings/security', label: 'Security & MFA', icon: Lock },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN'

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isSectionOpen = (section: NavSection) => {
    if (collapsed[section.key] !== undefined) return !collapsed[section.key]
    return section.defaultOpen !== false
  }

  const navContent = (
    <>
      {/* Brand + Sport Toggle */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
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
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Sport Mode</p>
          <SportToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navSections.map((section) => {
          const open = isSectionOpen(section)
          const hasActiveChild = section.items.some((item) => isActive(item.href, item.exact))

          return (
            <div key={section.key}>
              <button
                onClick={() => toggleSection(section.key)}
                className="flex items-center justify-between w-full px-3 py-2 group"
              >
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </span>
                {open ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                ) : (
                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 transition-colors',
                    hasActiveChild ? 'text-blue-400' : 'text-gray-300 group-hover:text-gray-500',
                  )} />
                )}
              </button>
              {open && (
                <div className="space-y-0.5 mt-0.5 mb-2">
                  {section.items.map((link) => {
                    const Icon = link.icon
                    const active = isActive(link.href, link.exact)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] relative',
                          active
                            ? 'nav-active font-semibold border-l-[3px] pl-[9px]'
                            : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900',
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 flex-shrink-0',
                            active ? 'nav-icon' : 'text-gray-400',
                          )}
                        />
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Shield className="w-4 h-4" />
            Switch to Admin View
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Marketing site
        </Link>
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
        {navContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 flex-shrink-0">
        {navContent}
      </aside>
    </>
  )
}
