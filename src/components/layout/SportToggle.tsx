'use client'

import { useSport } from '@/lib/sport-context'
import { cn } from '@/lib/utils'

export default function SportToggle() {
  const { sport, setSport } = useSport()

  return (
    <div className="relative inline-flex items-center rounded-lg border border-gray-200 bg-gray-100 p-1 gap-0.5">
      {/* Sliding background indicator */}
      <div
        className={cn(
          'absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-md bg-white shadow-sm border border-gray-200 transition-transform duration-300 ease-in-out',
          sport === 'TRACK' ? 'translate-x-[calc(100%+2px)]' : 'translate-x-0',
        )}
      />
      <button
        onClick={() => setSport('XC')}
        className={cn(
          'relative z-10 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-in-out',
          sport === 'XC'
            ? 'text-emerald-700'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        XC
      </button>
      <button
        onClick={() => setSport('TRACK')}
        className={cn(
          'relative z-10 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ease-in-out',
          sport === 'TRACK'
            ? 'text-blue-700'
            : 'text-gray-500 hover:text-gray-700',
        )}
      >
        Track
      </button>
    </div>
  )
}
