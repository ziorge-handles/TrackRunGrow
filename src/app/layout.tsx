import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import Providers from './providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'TrackRunGrow | Cross Country & Track and Field Coaching Platform',
    template: '%s | TrackRunGrow',
  },
  description: 'The complete coaching platform for cross country and track & field teams. Track performance, manage rosters, log workouts, analyze trends, and grow every athlete.',
  keywords: [
    'cross country coaching', 'track and field software', 'running team management',
    'race results tracker', 'athlete performance analytics', 'workout logging',
    'XC coaching tool', 'track coaching platform', 'high school cross country',
    'running coach software', 'meet lineup builder', 'race time tracking',
    'athlete portal', 'team management app', 'training log software'
  ],
  authors: [{ name: 'TrackRunGrow' }],
  creator: 'TrackRunGrow',
  publisher: 'TrackRunGrow',
  metadataBase: new URL('https://www.trackrungrow.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.trackrungrow.com',
    siteName: 'TrackRunGrow',
    title: 'TrackRunGrow | Cross Country & Track and Field Coaching Platform',
    description: 'Track performance, manage rosters, log workouts, and grow every athlete. The all-in-one coaching platform for XC and track teams.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TrackRunGrow - Coaching Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackRunGrow | Coaching Platform for XC & Track',
    description: 'The complete coaching platform for cross country and track & field teams.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
