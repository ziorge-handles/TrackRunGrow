'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  plan: string
  label: string
  highlight: boolean
}

export default function PricingButton({ plan, label, highlight }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (plan === 'enterprise') {
      window.location.href = '/contact'
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/public-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json() as { url?: string; error?: string }

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Failed to start checkout. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mt-8 block w-full text-center py-3 rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-70 ${
        highlight
          ? 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg'
          : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md shadow-emerald-500/15'
      }`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecting to checkout...
        </span>
      ) : (
        label
      )}
    </button>
  )
}
