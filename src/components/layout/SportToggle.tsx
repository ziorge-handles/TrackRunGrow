'use client'

import { useSport } from '@/lib/sport-context'
import { cn } from '@/lib/utils'

export default function SportToggle() {
  const { sport, setSport } = useSport()

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-100 p-1 gap-0.5">
      <button
        onClick={() => setSport('XC')}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
          sport === 'XC'
            ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        XC
      </button>
      <button
        onClick={() => setSport('TRACK')}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
          sport === 'TRACK'
            ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        Track
      </button>
    </div>
  )
}
