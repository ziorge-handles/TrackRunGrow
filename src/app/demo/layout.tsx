import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Interactive Demo',
  description: 'Try TrackRunGrow features without an account. Add athletes, log results, and track workouts in this interactive demo.',
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
