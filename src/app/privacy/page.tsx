export const metadata = {
  title: 'Privacy Policy | TrackRunGrow',
  description: 'Privacy Policy for the TrackRunGrow coaching platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: April 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              We collect the following types of information when you use TrackRunGrow:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li><strong>Account information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Performance data:</strong> Race results, workout logs, personal records, and event history entered by coaches or athletes.</li>
              <li><strong>Body metrics:</strong> Height, weight, and other physical measurements coaches may optionally record for athletes.</li>
              <li><strong>Payment information:</strong> Billing details processed securely through Stripe. We do not store credit card numbers on our servers.</li>
              <li><strong>Usage data:</strong> Basic analytics about how you interact with the platform to help us improve the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li><strong>Provide the service:</strong> Display your roster, track performance, manage meets, and facilitate team communication.</li>
              <li><strong>Analytics:</strong> Generate performance trends, projections, and personal best tracking for coaches and athletes.</li>
              <li><strong>AI suggestions:</strong> Power personalized workout suggestions and training plan generation using anonymized performance data.</li>
              <li><strong>Communication:</strong> Send transactional emails such as account verification, password resets, team invitations, and payment receipts.</li>
              <li><strong>Improvement:</strong> Analyze aggregate usage patterns to improve features and fix issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              We do not sell your personal data. We share data only with the following third-party services as necessary to operate the platform:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li><strong>Stripe:</strong> Payment processing. Stripe receives only the payment information needed to complete transactions.</li>
              <li><strong>SendGrid:</strong> Email delivery for transactional emails such as invitations, receipts, and notifications.</li>
              <li><strong>Anthropic (Claude AI):</strong> AI-powered workout suggestions. Performance data sent to Anthropic is used solely for generating recommendations and is not retained by Anthropic for training purposes.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              We may also disclose information if required by law, regulation, or legal process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account,
              all associated data is permanently removed from our systems within 30 days. Backups
              containing deleted data are purged within 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. COPPA Compliance</h2>
            <p className="text-gray-600 leading-relaxed">
              TrackRunGrow is not directed at children under the age of 13. Users must be at least
              13 years old to create an account. Athletes under 13 are not permitted on the platform.
              Coaches who enter data for athletes aged 13 to 17 are responsible for obtaining verifiable
              parental or guardian consent in accordance with applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights (GDPR)</h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              If you are located in the European Economic Area, you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 leading-relaxed">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Export:</strong> Download your data in a machine-readable format (CSV/JSON).</li>
              <li><strong>Correction:</strong> Request that we correct any inaccurate personal data.</li>
              <li><strong>Deletion:</strong> Request that we delete your account and all associated data.</li>
              <li><strong>Objection:</strong> Object to processing of your personal data in certain circumstances.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-2">
              To exercise any of these rights, contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              TrackRunGrow uses essential session cookies only to keep you signed in via NextAuth.
              We do not use advertising cookies or third-party tracking cookies. For more details,
              see our <a href="/cookies" className="text-emerald-600 hover:text-emerald-700 underline">Cookie Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at{' '}
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
