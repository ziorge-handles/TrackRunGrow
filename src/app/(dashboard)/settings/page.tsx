import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/stripe'
import { CheckCircle, CreditCard, User, Crown } from 'lucide-react'
import SettingsClient from './SettingsClient'
import { formatDate } from '@/lib/utils'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [coach, subscription] = await Promise.all([
    prisma.coach.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  const plan = (subscription?.plan ?? 'FREE') as keyof typeof PLANS
  const planInfo = PLANS[plan]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and subscription</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{user?.name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Member since</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className={plan !== 'FREE' ? 'border-emerald-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className={`w-4 h-4 ${plan === 'FREE' ? 'text-gray-400' : 'text-emerald-600'}`} />
              Subscription
            </CardTitle>
            <Badge
              className={
                plan === 'FREE' ? 'bg-gray-100 text-gray-700' :
                plan === 'PRO' ? 'bg-emerald-100 text-emerald-800' :
                'bg-purple-100 text-purple-800'
              }
            >
              {planInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planInfo.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-gray-400">
              {subscription.cancelAtPeriodEnd
                ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
                : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
            </p>
          )}

          {subscription?.status === 'PAST_DUE' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Your payment is past due. Please update your payment method.
            </div>
          )}

          <div className="pt-2">
            <SettingsClient
              plan={plan}
              hasStripeCustomer={!!subscription?.stripeCustomerId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Preview */}
      {plan === 'FREE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['PRO', 'ENTERPRISE'] as const).map((planKey) => {
            const p = PLANS[planKey]
            return (
              <Card key={planKey} className={planKey === 'PRO' ? 'border-emerald-300' : ''}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-gray-900">
                      ${(p.price / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-gray-400">/mo</span>
                    <Badge className={`ml-2 ${planKey === 'PRO' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                      {p.name}
                    </Badge>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        TrackRunGrow is currently in beta — pricing coming soon.
        All features are available for free during the beta period.
      </p>
    </div>
  )
}
