export const metadata = {
  title: 'Terms of Service | TrackRunGrow',
  description: 'Terms of Service for the TrackRunGrow coaching platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Service Description</h2>
            <p className="text-gray-600 leading-relaxed">
              TrackRunGrow is a coaching platform designed for cross country and track &amp; field programs.
              The platform provides roster management, performance tracking, AI-powered workout suggestions,
              race result management, team communication, and payment collection tools for coaches and their athletes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Account Terms</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li>You must be at least 13 years of age to create an account on TrackRunGrow.</li>
              <li>Athletes under the age of 13 are not permitted to use the platform.</li>
              <li>Coaches are responsible for obtaining parental or guardian consent for any athletes aged 13 to 17 whose data is entered into the platform.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate, complete, and current information when creating your account.</li>
              <li>You may not use the service for any unlawful purpose or in violation of any applicable laws.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Subscription &amp; Billing</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li>TrackRunGrow offers paid subscription plans billed on a monthly basis.</li>
              <li>Payment is processed securely through Stripe. Your payment information is never stored on our servers.</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</li>
              <li>We do not offer prorated refunds for partial months of service. If you believe you are entitled to a refund due to a billing error, please contact us within 30 days.</li>
              <li>We reserve the right to change pricing with 30 days advance notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li>Use the platform to harass, abuse, or harm another person.</li>
              <li>Upload or share content that is unlawful, defamatory, or otherwise objectionable.</li>
              <li>Attempt to gain unauthorized access to other users&apos; accounts or data.</li>
              <li>Interfere with or disrupt the platform or its underlying infrastructure.</li>
              <li>Use automated tools to scrape, crawl, or extract data from the platform without authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Ownership</h2>
            <p className="text-gray-600 leading-relaxed">
              Coaches retain full ownership of the team data they enter into TrackRunGrow, including
              athlete profiles, performance records, race results, and workout plans. You may export
              your data at any time. If you delete your account, all associated data will be permanently
              removed from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              TrackRunGrow is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
              We make no warranties, expressed or implied, regarding the reliability, accuracy, or
              availability of the service. To the fullest extent permitted by law, TrackRunGrow shall
              not be liable for any indirect, incidental, special, consequential, or punitive damages,
              or any loss of data, revenue, or profits arising out of or related to your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Modifications to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to update these Terms of Service at any time. When we make material
              changes, we will notify you by email or through a prominent notice on the platform. Your
              continued use of the service after such changes constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
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
