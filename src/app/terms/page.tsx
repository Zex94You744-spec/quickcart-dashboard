export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 22, 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using QuickCart, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Service Description</h2>
            <p>
              QuickCart provides a Telegram-based order management system for shop owners. Our service includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Automated order processing via Telegram bot</li>
              <li>PDF invoice generation</li>
              <li>Live order tracking</li>
              <li>Sales analytics and reporting</li>
              <li>Customer management dashboard</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscription & Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed monthly in advance</li>
              <li>All payments are processed securely through Razorpay</li>
              <li>You can upgrade or downgrade your plan at any time</li>
              <li>Unused features from lower plans do not carry over</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Transmit any viruses or malicious code</li>
              <li>Interfere with or disrupt the service</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of QuickCart are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
            <p>
              QuickCart shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account immediately, without prior notice, for any conduct that we believe violates these Terms or is harmful to other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact Information</h2>
            <p>
              For any questions about these Terms, please contact us at:
              <br />
              <strong>Email:</strong> support@quickcart.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
