import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team invitation',
  description: 'Accept your TrackRunGrow coaching team invitation.',
}

export default function AcceptInvitationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
