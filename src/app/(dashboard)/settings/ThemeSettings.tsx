'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from '@/lib/theme-context'
import { Sun, Moon, Monitor, Upload, Loader2 } from 'lucide-react'

const ACCENTS = [
  { name: 'blue', color: '#3b82f6', label: 'Blue' },
  { name: 'green', color: '#10b981', label: 'Green' },
  { name: 'purple', color: '#8b5cf6', label: 'Purple' },
  { name: 'red', color: '#ef4444', label: 'Red' },
  { name: 'orange', color: '#f97316', label: 'Orange' },
]

interface Props {
  isEnterprise?: boolean
}

export default function ThemeSettings({ isEnterprise = false }: Props) {
  const { theme, accent, setTheme, setAccent } = useTheme()
  const [customColor, setCustomColor] = useState('#3b82f6')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [savingBranding, setSavingBranding] = useState(false)
  const [savedBranding, setSavedBranding] = useState(false)

  useEffect(() => {
    if (isEnterprise) {
      fetch('/api/profile')
        .then((r) => r.json())
        .then((data) => {
          if (data.customAccentColor) setCustomColor(data.customAccentColor)
          if (data.customLogoUrl) setLogoPreview(data.customLogoUrl)
        })
        .catch(() => {})
    }
  }, [isEnterprise])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    }
  }

  const handleSaveBranding = async () => {
    setSavingBranding(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAccentColor: customColor }),
      })

      document.documentElement.style.setProperty('--accent', customColor)
      document.documentElement.style.setProperty('--accent-text', customColor)

      setSavedBranding(true)
      setTimeout(() => setSavedBranding(false), 3000)
    } catch {
      // handle silently
    } finally {
      setSavingBranding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Theme Mode</h4>
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Accent Color</h4>
        <div className="flex gap-3">
          {ACCENTS.map(({ name, color, label }) => (
            <button
              key={name}
              onClick={() => setAccent(name as typeof accent)}
              className="flex flex-col items-center gap-1.5 group"
              title={label}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 transition-transform ${
                  accent === name ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent group-hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {isEnterprise && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Custom Branding</h4>
          <p className="text-xs text-gray-400 mb-4">Enterprise feature — set a custom accent color and upload your school logo</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Custom Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#3b82f6"
                  maxLength={7}
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-gray-200"
                  style={{ backgroundColor: customColor }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                School Logo
              </label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center bg-white">
                    <Image src={logoPreview} alt="Logo" fill className="object-contain p-1" unoptimized />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">PNG or SVG recommended, max 2MB</p>
            </div>

            <button
              onClick={handleSaveBranding}
              disabled={savingBranding}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {savingBranding ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              ) : savedBranding ? (
                'Saved!'
              ) : (
                'Save Branding'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
