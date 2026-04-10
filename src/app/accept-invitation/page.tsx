'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, XCircle, Loader2, LogIn } from 'lucide-react'

interface InvitationData {
  teamName: string
  teamSchool: string
  inviterName: string
  coachRole: string
  invitedEmail: string
  expiresAt: string
}

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoadError('Invalid invitation link — no token provided.')
      return
    }

    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json() as InvitationData & { error?: string }
        if (!res.ok) {
          setLoadError(data.error ?? 'Invalid or expired invitation.')
        } else {
          setInvitation(data)
        }
      })
      .catch(() => setLoadError('Failed to load invitation. Please try again.'))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true)
    setAcceptError(null)

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json() as { success?: boolean; teamId?: string; error?: string }

      if (!res.ok) {
        setAcceptError(data.error ?? 'Failed to accept invitation.')
      } else {
        setAccepted(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    } catch {
      setAcceptError('Something went wrong. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  // Loading states
  if (status === 'loading' || (!invitation && !loadError)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-500 mb-6">{loadError}</p>
            <Link href="/dashboard">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-500">
              You have joined <strong>{invitation?.teamName}</strong>. Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
        </CardHeader>

        <CardContent className="pt-4 pb-6 space-y-6">
          {invitation && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Team</span>
                <span className="font-medium text-gray-900">{invitation.teamName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">School</span>
                <span className="font-medium text-gray-900">{invitation.teamSchool}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invited by</span>
                <span className="font-medium text-gray-900">{invitation.inviterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="font-medium text-emerald-700">{formatRole(invitation.coachRole)}</span>
              </div>
            </div>
          )}

          {status !== 'authenticated' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center">
                Please sign in or create an account to accept this invitation.
              </p>
              <Link href={`/login?callbackUrl=/accept-invitation?token=${token}`} className="block">
                <Button variant="primary" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in to accept
                </Button>
              </Link>
              <Link href={`/register?callbackUrl=/accept-invitation?token=${token}`} className="block">
                <Button variant="outline" className="w-full">
                  Create new account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {invitation && session.user.email?.toLowerCase() !== invitation.invitedEmail.toLowerCase() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  This invitation was sent to <strong>{invitation.invitedEmail}</strong> but you are
                  signed in as <strong>{session.user.email}</strong>. Please sign in with the correct account.
                </div>
              )}

              {acceptError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {acceptError}
                </div>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={handleAccept}
                disabled={
                  accepting ||
                  (invitation
                    ? session.user.email?.toLowerCase() !== invitation.invitedEmail.toLowerCase()
                    : false)
                }
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>

              <Link href="/dashboard" className="block">
                <Button variant="ghost" className="w-full">
                  Maybe later
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
