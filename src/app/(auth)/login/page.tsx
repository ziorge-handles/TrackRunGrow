'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect ?demo=true to /demo page
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      router.replace('/demo')
    }
  }, [searchParams, router])

  const verifiedBanner = searchParams.get('verified') === 'true'

  // Redirect already-logged-in users based on role
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role
      if (role === 'ATHLETE') {
        router.push('/portal')
      } else if (role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    setNeedsVerification(false)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        const unverified =
          result.error === 'CredentialsSignin' && result.code === 'email_not_verified'
        if (unverified) {
          setNeedsVerification(true)
          setError(
            'Please verify your email before signing in. Check your inbox or request a new link below.',
          )
        } else {
          setError('Invalid email or password. Please try again.')
        }
      } else {
        // Force a session refresh so we can read the role
        router.refresh()
        // The useEffect above will handle redirection based on role
        // As a fallback, redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
      </div>

      {verifiedBanner && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          Your email is verified. You can sign in below.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
            {needsVerification && (
              <div className="mt-3 pt-3 border-t border-red-200">
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(getValues('email') || '')}`}
                  className="font-medium text-emerald-700 hover:text-emerald-800 underline-offset-2 hover:underline"
                >
                  Resend verification email
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Didn&apos;t get a verification email?{' '}
        <Link
          href="/resend-verification"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Resend link
        </Link>
      </p>

      <p className="mt-2 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Create one
        </Link>
      </p>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400">
          Want to try it out?{' '}
          <a href="/demo" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Try Interactive Demo
          </a>
        </p>
      </div>
    </>
  )
}
