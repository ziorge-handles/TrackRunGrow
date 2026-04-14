'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
      <ResendForm />
    </Suspense>
  )
}

function ResendForm() {
  const searchParams = useSearchParams()
  const prefilled = searchParams.get('email') ?? ''

  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefilled },
  })

  useEffect(() => {
    if (prefilled) setValue('email', prefilled)
  }, [prefilled, setValue])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      const payload = (await res.json()) as { message?: string; error?: string }
      if (!res.ok) {
        setError(payload.error ?? 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Resend verification email</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter the email you used to register. We&apos;ll send a new link if the account still needs verification.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            If this account exists and still needs verification, you should receive an email shortly. Check your inbox and spam folder.
          </div>
          <Link
            href="/login"
            className="block text-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
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

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending…' : 'Send verification link'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
