'use client'

import { useTheme } from '@/lib/theme-context'
import { Sun, Moon, Monitor } from 'lucide-react'

const ACCENTS = [
  { name: 'blue', color: '#3b82f6', label: 'Blue' },
  { name: 'green', color: '#10b981', label: 'Green' },
  { name: 'purple', color: '#8b5cf6', label: 'Purple' },
  { name: 'red', color: '#ef4444', label: 'Red' },
  { name: 'orange', color: '#f97316', label: 'Orange' },
]

export default function ThemeSettings() {
  const { theme, accent, setTheme, setAccent } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Theme Mode</h4>
        <div className="flex gap-2">
          {[
            { value: 'light' as const, icon: Sun, label: 'Light' },
            { value: 'dark' as const, icon: Moon, label: 'Dark' },
            { value: 'system' as const, icon: Monitor, label: 'System' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                theme === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Accent Color</h4>
        <div className="flex gap-3">
          {ACCENTS.map(({ name, color, label }) => (
            <button
              key={name}
              onClick={() => setAccent(name as typeof accent)}
              className={`flex flex-col items-center gap-1.5 group`}
              title={label}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 transition-transform ${
                  accent === name ? 'border-gray-900 scale-110' : 'border-transparent group-hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-gray-500">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
