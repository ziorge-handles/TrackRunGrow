'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Lock } from 'lucide-react'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      message: 'You must agree to the Terms of Service and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create account</h2>
        <p className="text-sm text-gray-500 mt-1">Loading...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const planFromUrl = searchParams.get('plan')
  const [isLoading, setIsLoading] = useState(false)
  const [stripeEmail, setStripeEmail] = useState<string | null>(null)
  const [stripePlan, setStripePlan] = useState<string | null>(planFromUrl)
  const [loadingSession, setLoadingSession] = useState(!!sessionId)

  const hasPayment = !!sessionId

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password') || ''
  const passwordChecks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ]

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function fetchSessionInfo() {
      try {
        const res = await fetch(`/api/stripe/session-info?session_id=${sessionId}`)
        const data = await res.json() as { email?: string; plan?: string; error?: string }
        if (cancelled) return

        if (!res.ok || !data.email) {
          toast.error(data.error ?? 'Could not verify payment session.')
          return
        }

        setStripeEmail(data.email)
        if (data.plan) setStripePlan(data.plan)
      } catch {
        if (!cancelled) toast.error('Failed to verify payment. Please try again.')
      } finally {
        if (!cancelled) setLoadingSession(false)
      }
    }

    fetchSessionInfo()
    return () => { cancelled = true }
  }, [sessionId])

  const onSubmit = async (data: RegisterFormData) => {
    if (!stripeEmail) return
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: stripeEmail,
          password: data.password,
          stripeSessionId: sessionId,
        }),
      })

      const result = await res.json() as { error?: string }
      if (!res.ok) {
        toast.error(result.error ?? 'Registration failed')
        setIsLoading(false)
        return
      }

      toast.success('Account created! Please sign in.')
      router.push('/login')
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasPayment) {
    return (
      <>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Subscription Required</h2>
          <p className="text-sm text-gray-500 mt-1">
            Please select a plan and complete payment before creating your account.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            A subscription is required to use TrackRunGrow. Choose a plan from our pricing page to get started.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="block w-full text-center py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          View Plans &amp; Pricing
        </Link>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </>
    )
  }

  if (loadingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-gray-500">Verifying your payment...</p>
      </div>
    )
  }

  if (!stripeEmail) {
    return (
      <>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment Verification Failed</h2>
          <p className="text-sm text-gray-500 mt-1">
            We could not verify your payment session. Please try again.
          </p>
        </div>
        <Link
          href="/#pricing"
          className="block w-full text-center py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Return to Pricing
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Complete Your Account</h2>
        <p className="text-sm text-gray-500 mt-1">
          Just a few more details to finish setting up
        </p>
        {stripePlan && (
          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {stripePlan.charAt(0).toUpperCase() + stripePlan.slice(1).toLowerCase()} Plan — Payment Complete
            </Badge>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={stripeEmail}
              readOnly
              className="bg-gray-50 text-gray-600 pr-10 cursor-not-allowed"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400">Verified via Stripe — cannot be changed</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Coach Jane Smith"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
          {password.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <div className="flex gap-1">
                {passwordChecks.map((check) => (
                  <div
                    key={check.label}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      check.met ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {passwordChecks.map((check) => (
                  <p
                    key={check.label}
                    className={`text-xs flex items-center gap-1 ${
                      check.met ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {check.met ? '\u2713' : '\u2022'} {check.label}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            id="acceptTerms"
            type="checkbox"
            {...register('acceptTerms')}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-600">
            I agree to the{' '}
            <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline" target="_blank">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating your account...</>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
