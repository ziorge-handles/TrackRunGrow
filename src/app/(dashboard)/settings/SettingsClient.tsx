'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, ExternalLink } from 'lucide-react'
import type { SubscriptionPlan } from '@/generated/prisma/client'

interface Props {
  plan: SubscriptionPlan
  hasStripeCustomer: boolean
}

export default function SettingsClient({ plan, hasStripeCustomer }: Props) {
  const [loadingCheckout, setLoadingCheckout] = useState<'PRO' | 'ENTERPRISE' | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (targetPlan: 'PRO' | 'ENTERPRISE') => {
    setLoadingCheckout(targetPlan)
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      })

      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start checkout')
      } else {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoadingCheckout(null)
    }
  }

  const handleManageBilling = async () => {
    setLoadingPortal(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to open billing portal')
      } else {
        window.location.href = data.url
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {plan === 'FREE' && (
          <>
            <Button
              variant="primary"
              onClick={() => handleUpgrade('PRO')}
              disabled={loadingCheckout !== null}
            >
              {loadingCheckout === 'PRO' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" />Upgrade to Pro — $29/mo</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpgrade('ENTERPRISE')}
              disabled={loadingCheckout !== null}
            >
              {loadingCheckout === 'ENTERPRISE' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                'Upgrade to Enterprise — $99/mo'
              )}
            </Button>
          </>
        )}

        {hasStripeCustomer && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={loadingPortal}
          >
            {loadingPortal ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
            ) : (
              <><ExternalLink className="w-4 h-4 mr-2" />Manage Billing</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
