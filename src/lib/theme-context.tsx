'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange'

interface ThemeState {
  theme: Theme
  accent: AccentColor
  setTheme: (t: Theme) => void
  setAccent: (a: AccentColor) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeState | null>(null)

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem('trg-theme') as Theme) || 'light'
}

function getInitialAccent(): AccentColor {
  if (typeof window === 'undefined') return 'blue'
  return (localStorage.getItem('trg-accent') as AccentColor) || 'blue'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  if (theme === 'dark') return 'dark'
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [accent, setAccentState] = useState<AccentColor>(getInitialAccent)
  const resolvedTheme = resolveTheme(theme)

  useEffect(() => {
    localStorage.setItem('trg-theme', theme)
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [theme, resolvedTheme])

  useEffect(() => {
    localStorage.setItem('trg-accent', accent)
    document.documentElement.setAttribute('data-accent', accent)
  }, [accent])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const setAccent = useCallback((a: AccentColor) => setAccentState(a), [])

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
