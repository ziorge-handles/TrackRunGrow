'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { SportProvider } from '@/lib/sport-context'
import CookieConsent from '@/components/ui/CookieConsent'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SportProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <CookieConsent />
        </SportProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
