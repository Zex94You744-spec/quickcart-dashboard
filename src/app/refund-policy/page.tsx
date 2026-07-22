export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 22, 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Overview</h2>
            <p>
              At QuickCart, we strive to provide the best service possible. Due to the digital nature of our service, please read our refund policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7-Day Money-Back Guarantee</h2>
            <p>
              We offer a <strong>7-day money-back guarantee</strong> for all new subscriptions. If you are not satisfied with our service within the first 7 days of your initial subscription, you can request a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Eligibility for Refund</h2>
            <p>To be eligible for a refund:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The request must be made within 7 days of the initial subscription purchase</li>
              <li>This applies only to the first subscription, not renewals</li>
              <li>You must not have violated our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How to Request a Refund</h2>
            <p>To request a refund, please contact us at:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Email:</strong> support@quickcart.com</li>
              <li>Include your account email and reason for refund</li>
              <li>Refunds will be processed within 5-7 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Non-Refundable Cases</h2>
            <p>Refunds are not available for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription renewals (only initial subscription is covered)</li>
              <li>Requests made after 7 days of purchase</li>
              <li>Accounts that have violated our Terms of Service</li>
              <li>Partial month usage (no prorated refunds)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cancellation</h2>
            <p>
              You can cancel your subscription at any time from your dashboard. After cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access will continue until the end of the current billing period</li>
              <li>No further charges will be made</li>
              <li>Your data will be retained for 30 days after cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
            <p>
              If you have any questions about our refund policy, please contact us at:
              <br />
              <strong>Email:</strong> support@quickcart.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
