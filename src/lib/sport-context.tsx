'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Sport } from '@/generated/prisma/client'

interface SportContextValue {
  sport: Sport
  setSport: (sport: Sport) => void
}

const SportContext = createContext<SportContextValue | null>(null)

const STORAGE_KEY = 'trackrungrow-sport'
const DEFAULT_SPORT: Sport = 'XC'

export function SportProvider({ children }: { children: React.ReactNode }) {
  const [sport, setSportState] = useState<Sport>(DEFAULT_SPORT)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'XC' || stored === 'TRACK') {
        setSportState(stored)
      }
    } catch {
      // localStorage unavailable (SSR or private mode)
    }
  }, [])

  const setSport = (newSport: Sport) => {
    setSportState(newSport)
    try {
      localStorage.setItem(STORAGE_KEY, newSport)
    } catch {
      // ignore
    }
  }

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
