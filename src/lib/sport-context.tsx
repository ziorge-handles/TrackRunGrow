'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Sport } from '@/generated/prisma/client'

interface SportContextValue {
  sport: Sport
  setSport: (sport: Sport) => void
}

const SportContext = createContext<SportContextValue | null>(null)

const STORAGE_KEY = 'trackrungrow-sport'

const SPORT_VARS: Record<Sport, { primary: string; light: string; text: string }> = {
  XC: { primary: '#10b981', light: '#ecfdf5', text: '#059669' },
  TRACK: { primary: '#ef4444', light: '#fef2f2', text: '#dc2626' },
}

function applySportVars(sport: Sport) {
  if (typeof document === 'undefined') return
  const vars = SPORT_VARS[sport]
  document.documentElement.setAttribute('data-sport', sport)
  document.documentElement.style.setProperty('--accent', vars.primary)
  document.documentElement.style.setProperty('--accent-light', vars.light)
  document.documentElement.style.setProperty('--accent-text', vars.text)
}

function getInitialSport(): Sport {
  if (typeof window === 'undefined') return 'XC'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'XC' || stored === 'TRACK') return stored
  } catch {
    // localStorage unavailable
  }
  return 'XC'
}

export function SportProvider({ children }: { children: React.ReactNode }) {
  const [sport, setSportState] = useState<Sport>(getInitialSport)

  // Apply CSS vars on mount and whenever sport changes
  useEffect(() => {
    applySportVars(sport)
  }, [sport])

  const setSport = useCallback((newSport: Sport) => {
    setSportState(newSport)
    try {
      localStorage.setItem(STORAGE_KEY, newSport)
    } catch {
      // ignore
    }
  }, [])

  return (
    <SportContext.Provider value={{ sport, setSport }}>
      {children}
    </SportContext.Provider>
  )
}

export function useSport(): SportContextValue {
  const ctx = useContext(SportContext)
  if (!ctx) {
    throw new Error('useSport must be used within a SportProvider')
  }
  return ctx
}
