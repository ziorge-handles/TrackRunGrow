'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, XCircle, Loader2, LogIn, Home } from 'lucide-react'

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

function coachHomeHref(role: string | undefined): string {
  return role === 'ATHLETE' ? '/portal' : '/dashboard'
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = searchParams.get('token')

  const acceptReturnUrl =
    token != null && token !== ''
      ? encodeURIComponent(`/accept-invitation?token=${token}`)
      : encodeURIComponent('/accept-invitation')

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [inviteFetchDone, setInviteFetchDone] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoadError('Invalid invitation link — no token provided.')
      setInviteFetchDone(true)
      return
    }

    let cancelled = false
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json() as InvitationData & { error?: string }
        if (cancelled) return
        if (!res.ok) {
          setLoadError(data.error ?? 'Invalid or expired invitation.')
        } else {
          setInvitation(data)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Failed to load invitation. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setInviteFetchDone(true)
      })

    return () => { cancelled = true }
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
        // Coach membership is created server-side; team view is always /dashboard
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    } catch {
      setAcceptError('Something went wrong. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  // Invitation still loading
  if (!inviteFetchDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 flex flex-col items-center justify-center px-4 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-600" aria-hidden />
        <p className="text-sm text-gray-600">Loading invitation…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 mb-3">
            <Users className="w-6 h-6 text-white" aria-hidden />
          </div>
          <h1 className="text-lg font-bold text-gray-900">TrackRunGrow</h1>
        </div>
        <Card className="w-full max-w-md border-gray-200 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation unavailable</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{loadError}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/login?callbackUrl=${acceptReturnUrl}`} className="flex-1">
                <Button variant="primary" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-gray-200 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" aria-hidden />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re on the team</h2>
            <p className="text-gray-600 text-sm">
              Welcome to <strong>{invitation?.teamName}</strong>. Redirecting to your dashboard…
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expiresLabel = invitation?.expiresAt
    ? (() => {
        try {
          return format(new Date(invitation.expiresAt), 'MMM d, yyyy · h:mm a')
        } catch {
          return null
        }
      })()
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 mb-3">
          <Users className="w-6 h-6 text-white" aria-hidden />
        </div>
        <h1 className="text-lg font-bold text-gray-900">TrackRunGrow</h1>
        <p className="text-xs text-gray-500 mt-1">Coaching invitation</p>
      </div>

      <Card className="w-full max-w-md border-gray-200 shadow-lg">
        <CardHeader className="text-center pb-2 pt-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-emerald-600" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-semibold">Team invitation</CardTitle>
          {expiresLabel && (
            <p className="text-xs text-gray-500 mt-2">
              Link expires <time dateTime={invitation?.expiresAt}>{expiresLabel}</time>
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-2 pb-6 px-6 space-y-6">
          {invitation && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm border border-slate-100">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Team</span>
                <span className="font-medium text-gray-900 text-right">{invitation.teamName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">School</span>
                <span className="font-medium text-gray-900 text-right">{invitation.teamSchool}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Invited by</span>
                <span className="font-medium text-gray-900 text-right">{invitation.inviterName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Role</span>
                <span className="font-medium text-emerald-700 text-right">{formatRole(invitation.coachRole)}</span>
              </div>
            </div>
          )}

          {status === 'loading' ? (
            <div className="flex flex-col items-center gap-2 py-4 text-sm text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" aria-hidden />
              Checking your account…
            </div>
          ) : status !== 'authenticated' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                Sign in with the email this invitation was sent to, or create an account with that same email.
              </p>
              <Link href={`/login?callbackUrl=${acceptReturnUrl}`} className="block">
                <Button variant="primary" className="w-full">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in to accept
                </Button>
              </Link>
              <Link
                href={
                  token
                    ? `/register?invite_token=${encodeURIComponent(token)}`
                    : '/register'
                }
                className="block"
              >
                <Button variant="outline" className="w-full">
                  Create account (invited email)
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {invitation && session.user.email?.toLowerCase() !== invitation.invitedEmail.toLowerCase() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                  This invitation was sent to <strong>{invitation.invitedEmail}</strong> but you are
                  signed in as <strong>{session.user.email}</strong>. Sign out and use the invited email, or ask for a new invite.
                </div>
              )}

              {acceptError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
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
                    Accepting…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept invitation
                  </>
                )}
              </Button>

              <Link href={coachHomeHref(session.user.role)} className="block">
                <Button variant="ghost" className="w-full text-gray-600">
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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-emerald-600" aria-hidden />
          <p className="text-sm text-gray-600">Loading…</p>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
