'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyingState />}>
      <VerifyEmailForm />
    </Suspense>
  )
}

function VerifyingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <p className="text-sm text-gray-500">Verifying your email...</p>
    </div>
  )
}

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setStatus('error')
      setErrorMsg('Invalid verification link.')
      return
    }

    let cancelled = false

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })
        if (cancelled) return

        if (res.ok) {
          setStatus('success')
          setTimeout(() => router.push('/login?verified=true'), 2000)
        } else {
          const data = await res.json() as { error?: string }
          setStatus('error')
          setErrorMsg(data.error ?? 'Verification failed.')
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg('Something went wrong. Please try again.')
        }
      }
    }

    verify()
    return () => { cancelled = true }
  }, [token, email, router])

  if (status === 'verifying') {
    return <VerifyingState />
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
        <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
        <p className="text-sm text-gray-500">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <XCircle className="w-12 h-12 text-red-500" />
      <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
      <p className="text-sm text-gray-500">{errorMsg}</p>
      <button
        onClick={() => router.push('/login')}
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        Go to Login
      </button>
    </div>
  )
}
