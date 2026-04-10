export const metadata = {
  title: 'Cookie Policy | TrackRunGrow',
  description: 'Cookie Policy for the TrackRunGrow coaching platform.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies Only</h2>
            <p className="text-gray-600 leading-relaxed">
              TrackRunGrow uses essential cookies only. These cookies are strictly necessary for the
              platform to function and cannot be disabled. We do not use any advertising, marketing,
              or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cookie Name</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">authjs.session-token</td>
                    <td className="px-4 py-3">Session management via NextAuth. Keeps you signed in.</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">authjs.csrf-token</td>
                    <td className="px-4 py-3">CSRF protection for authentication requests.</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">authjs.callback-url</td>
                    <td className="px-4 py-3">Stores the redirect URL after sign-in.</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li>
                <strong>Stripe:</strong> When you make a payment, Stripe may set its own cookies
                to process the transaction securely. These are governed by{' '}
                <a href="https://stripe.com/privacy" className="text-emerald-600 hover:text-emerald-700 underline" target="_blank" rel="noopener noreferrer">
                  Stripe&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Vercel Analytics:</strong> If enabled in the future, Vercel Analytics uses
                privacy-friendly, cookie-free analytics that do not track individual users.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">No Tracking Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not use Google Analytics, Facebook Pixel, or any other third-party tracking
              tools. We do not serve targeted advertisements. Your browsing activity on TrackRunGrow
              is not shared with advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about our use of cookies, please contact us at{' '}
              <a href="mailto:ryanmelvin@trackrungrow.com" className="text-emerald-600 hover:text-emerald-700 underline">
                ryanmelvin@trackrungrow.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
