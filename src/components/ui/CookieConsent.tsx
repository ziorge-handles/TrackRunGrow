'use client'

import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (!localStorage.getItem('cookie-consent')) {
        setVisible(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          We use essential cookies to keep you signed in. No tracking cookies.{' '}
          <a href="/cookies" className="text-emerald-600 hover:text-emerald-700 underline">
            Learn more
          </a>
        </p>
        <button
          onClick={handleAccept}
          className="flex-shrink-0 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
