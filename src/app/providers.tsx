'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { SportProvider } from '@/lib/sport-context'
import { ThemeProvider } from '@/lib/theme-context'
import CookieConsent from '@/components/ui/CookieConsent'
import TrackyBubble from '@/components/ui/TrackyBubble'

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
        <ThemeProvider>
          <SportProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <CookieConsent />
            <TrackyBubble />
          </SportProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
