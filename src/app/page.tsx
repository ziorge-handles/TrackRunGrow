export const revalidate = 60

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import {
  Users, TrendingUp, Brain, Trophy, Calendar, CheckSquare,
  MessageSquare, DollarSign, FileText, Tag, Download, UserCog,
  Star, ArrowRight, Zap, MapPin, Timer, Mail,
} from 'lucide-react'
import ReviewForm from '@/components/ui/ReviewForm'
import DemoButton from '@/components/ui/DemoButton'
import PricingButton from '@/components/ui/PricingButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string
  authorName: string
  authorRole: string
  authorOrg: string | null
  rating: number
  title: string
  body: string
  submittedAt: Date
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getApprovedReviews(): Promise<Review[]> {
  try {
    return await prisma.review.findMany({
      where: { status: 'APPROVED' },
      orderBy: { submittedAt: 'desc' },
      take: 6,
    })
  } catch {
    return []
  }
}

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Users, title: 'Roster & Member Profiles', desc: 'Complete athlete profiles with photos, body metrics, and history', color: 'bg-blue-100 text-blue-600' },
  { icon: TrendingUp, title: 'Performance Tracking', desc: 'Trend charts, projections, and personal best tracking across all events', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Brain, title: 'AI Workout Suggestions', desc: 'Claude AI generates personalized weekly training plans', color: 'bg-purple-100 text-purple-600' },
  { icon: Trophy, title: 'Race Results & Meet Lineups', desc: 'Bulk result entry, heat/lane assignments, qualifying marks', color: 'bg-amber-100 text-amber-600' },
  { icon: Calendar, title: 'Team Calendar', desc: 'Sync race schedules and practice plans across all devices', color: 'bg-sky-100 text-sky-600' },
  { icon: CheckSquare, title: 'Event Attendance', desc: 'Real-time check-in, availability tracking, and attendance reports', color: 'bg-teal-100 text-teal-600' },
  { icon: MessageSquare, title: 'Team Chat & Messaging', desc: 'Channels, direct messages, and email notifications', color: 'bg-indigo-100 text-indigo-600' },
  { icon: DollarSign, title: 'Team Fees & Payments', desc: 'Online fee collection with Stripe, payment tracking, reminders', color: 'bg-green-100 text-green-600' },
  { icon: FileText, title: 'Documents & Photos', desc: 'Waivers, forms, race photos — all in one place', color: 'bg-rose-100 text-rose-600' },
  { icon: Tag, title: 'Tracking Lists', desc: 'Custom lists for qualifiers, physicals, equipment, and more', color: 'bg-orange-100 text-orange-600' },
  { icon: Download, title: 'CSV/JSON Import & Export', desc: 'Import results from timing systems, export for reporting', color: 'bg-slate-100 text-slate-600' },
  { icon: UserCog, title: 'Athlete Portal', desc: 'Athletes log in to view their stats, training plans, and schedules', color: 'bg-violet-100 text-violet-600' },
]

const PRICING = [
  {
    name: 'Basic',
    price: '$5',
    desc: '1 team, up to 25 athletes',
    features: ['1 team', 'Up to 25 athletes', 'Performance tracking', 'Race results', 'Workout logs', 'Calendar'],
    cta: 'Start Today',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    desc: 'Unlimited teams, unlimited athletes',
    features: ['Unlimited teams', 'Unlimited athletes', 'AI workout suggestions', 'Advanced analytics & projections', 'Coach invitations', 'Body metrics tracking', 'Full calendar', 'Athlete portal', 'Meet lineups', 'CSV import/export'],
    cta: 'Start Today',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    desc: 'For large programs & districts',
    features: ['Everything in Pro', 'Multi-school support', 'Custom branding', 'Priority support', 'Data export API'],
    cta: 'Contact Us',
    highlight: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MarketingPage() {
  const reviews = await getApprovedReviews()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TrackRunGrow',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    description: 'The complete coaching platform for cross country and track & field teams.',
    url: 'https://www.trackrungrow.com',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '5',
      highPrice: '99',
      priceCurrency: 'USD',
    },
  }

  return (
    <div id="top" className="min-h-screen bg-white font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TrackRunGrow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#top" className="hover:text-gray-900 transition-colors">Home</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#reviews" className="hover:text-gray-900 transition-colors">Reviews</a>
            <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Log In
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              Start Today <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex md:hidden items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg">Log In</Link>
            <a href="#pricing" className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">Start Today</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              The Complete Coaching Platform for{' '}
              <span className="text-emerald-400">Cross Country &amp; Track</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed max-w-2xl">
              Track every mile. Grow every athlete. Win every meet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-emerald-500/25"
              >
                Start Today <ArrowRight className="w-4 h-4" />
              </a>
              <DemoButton />
            </div>
          </div>
        </div>
        <div className="relative h-16">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L1440 64L1440 0C1200 48 800 64 720 64C640 64 240 48 0 0L0 64Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Mission Statement ──────────────────────────────────────────────── */}
      <section id="mission" className="relative z-10 -mt-px py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Here at TRG, we believe data can be an extremely powerful tool in assisting coaches and runners in their journey. Insights into performances, recovery, and various important pieces can not only boost the gains for athletes during a season, but over their lifetime.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">Everything You Need</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Built for coaches. Loved by athletes.</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              TrackRunGrow brings together every tool your program needs in one platform — no more juggling spreadsheets, apps, and group chats.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="group bg-white border border-gray-100 rounded-xl p-6 card-hover hover:border-emerald-300 hover:shadow-emerald-50 transition-all duration-200">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Sport Toggle ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">Cross Country &amp; Track Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">One platform. Two sports.</h2>
            <p className="mt-4 text-lg text-gray-500">Seamlessly switch between Cross Country and Track &amp; Field modes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white border-2 border-emerald-400 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Cross Country</h3>
                  <p className="text-xs text-emerald-600 font-medium">XC Mode</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {['Team records & team scores', 'Varsity/JV split results', 'Course distance tracking (5K/8K)', 'Invitational heat management', 'Dual-meet scoring calculator', 'Season mileage reports'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border-2 border-blue-400 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Timer className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Track &amp; Field</h3>
                  <p className="text-xs text-blue-600 font-medium">Track Mode</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {['All events: sprints, hurdles, jumps, throws', 'Heat & lane assignments', 'Qualifying mark tracking', 'Relay team builder', 'Field event unit conversions', 'Multi-event & combined scoring'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-500">Choose the plan that fits your program.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-7 flex flex-col card-hover ${plan.highlight ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-xl shadow-emerald-200 border-2 border-emerald-400 scale-[1.02] z-10' : 'bg-white border border-gray-200'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                    MOST POPULAR
                  </div>
                )}
                <div>
                  <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.highlight ? 'text-emerald-200' : 'text-gray-500'}`}>{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-emerald-200' : 'text-gray-400'}`}>/mo</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs ${plan.highlight ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>&#10003;</span>
                      <span className={plan.highlight ? 'text-emerald-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <PricingButton
                  plan={plan.name.toLowerCase()}
                  label={plan.cta}
                  highlight={plan.highlight}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      <section id="reviews" className="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">What Coaches Are Saying</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Real reviews from coaches who use TrackRunGrow
            </p>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl max-w-lg mx-auto mb-16">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium text-lg mb-2">Be the first to share your experience</p>
              <p className="text-gray-400 text-sm">Submit a review below and help other coaches discover TrackRunGrow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-6 card-hover relative">
                  <div className="absolute top-5 right-5 text-5xl leading-none text-gray-100 font-serif select-none" aria-hidden="true">&ldquo;</div>
                  <StarRating rating={review.rating} />
                  <h3 className="font-bold text-gray-900 mt-3">{review.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed relative">{review.body}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{review.authorName}</p>
                      <p className="text-xs text-gray-400">{review.authorRole}{review.authorOrg ? ` — ${review.authorOrg}` : ''}</p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(review.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Leave a Review</h3>
            <ReviewForm />
          </div>
        </div>
      </section>

      {/* ── Contact / Support ─────────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">Support</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-lg text-gray-500 mb-8">
            We are here to help. Reach out anytime and we will get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:ryanmelvin@trackrungrow.com"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md shadow-emerald-500/15"
            >
              <Mail className="w-5 h-5" />
              ryanmelvin@trackrungrow.com
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
            >
              Contact Form
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white text-lg">TrackRunGrow</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                Track every mile. Grow every athlete. The complete coaching platform for XC and track &amp; field.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-white font-semibold text-sm mb-3">Platform</p>
                <ul className="space-y-2 text-sm">
                  <li><a href="#top" className="hover:text-white transition-colors">Home</a></li>
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#reviews" className="hover:text-white transition-colors">Reviews</a></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-3">Account</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-3">Legal</p>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} TrackRunGrow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
