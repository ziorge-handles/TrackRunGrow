import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resend verification',
  description: 'Request a new email verification link for your TrackRunGrow account.',
}

export default function ResendVerificationAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
