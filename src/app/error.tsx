'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application error:', error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="text-6xl font-bold text-gray-200 mb-4">500</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8 max-w-md">An unexpected error occurred. Our team has been notified.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Try Again
          </button>
          <Link href="/" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Go Home
          </Link>
        </div>
        {error.digest && <p className="mt-4 text-xs text-gray-400">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
