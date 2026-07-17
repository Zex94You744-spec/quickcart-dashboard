export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">QuickCart</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition">Pricing</a>
              <a href="/signup" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-blue-100">
            🎉 Special Offer: 7 Days Free + First Month 50% Off!
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Digitize Your Shop in <span className="text-blue-600">Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Take orders via Telegram, generate automatic invoices, and track your sales in real-time. Everything your business needs, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <a 
              href="/signup" 
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              🚀 Start 7-Day Free Trial
            </a>
            <a 
              href="#how-it-works" 
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              ▶️ See How It Works
            </a>
          </div>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1">✓ No credit card required</span>            <span className="flex items-center gap-1">✓ 7 days completely free</span>
            <span className="flex items-center gap-1">✓ First month 50% off</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Grow</h2>
            <p className="text-lg text-gray-600">A complete solution designed for modern businesses.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📱', title: 'Telegram Orders', desc: 'Customers send orders on Telegram, and our AI automatically extracts the details.' },
              { icon: '📊', title: 'Sales Analytics', desc: 'Track your business growth with real-time charts and insightful graphs.' },
              { icon: '🧾', title: 'Auto PDF Invoices', desc: 'Professional, branded invoices are automatically generated and sent to customers.' },
              { icon: '📦', title: 'Live Order Tracking', desc: 'Share live tracking links with your customers for a premium experience.' },
              { icon: '🧮', title: 'GST Calculation', desc: 'Automatic GST calculation and detailed reporting for hassle-free accounting.' },
              { icon: '📥', title: 'CSV Export', desc: 'Export all your sales and order data to Excel with a single click.' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Get started in 3 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { step: '1', title: 'Sign Up', desc: 'Register for your 7-day free trial in less than a minute.' },
              { step: '2', title: 'Bot Setup', desc: 'Follow our simple guide, or let our team set up your custom Telegram bot.' },
              { step: '3', title: 'Start Taking Orders', desc: 'Share your bot link with customers and watch your digital sales grow.' }
            ].map((item, idx) => (
              <div key={idx} className="relative p-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">7 days free trial + First month 50% off!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-500 text-sm mb-6">Perfect for small shops</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">₹499<span className="text-lg text-gray-500 font-normal">/month</span></div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">✓ 50 orders/month</li>
                <li className="flex items-center gap-2">✓ Basic dashboard</li>
                <li className="flex items-center gap-2">✓ PDF invoices</li>
                <li className="flex items-center gap-2 text-gray-400">✗ CSV export</li>
              </ul>
              <a href="/signup" className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">Start Free Trial</a>
            </div>

            {/* Pro */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-600 relative transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-gray-500 text-sm mb-6">Best for growing businesses</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">₹999<span className="text-lg text-gray-500 font-normal">/month</span></div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">✓ Unlimited orders</li>
                <li className="flex items-center gap-2">✓ Advanced dashboard</li>
                <li className="flex items-center gap-2">✓ PDF invoices</li>
                <li className="flex items-center gap-2">✓ CSV export</li>
                <li className="flex items-center gap-2">✓ Email support</li>
              </ul>
              <a href="/signup" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Start Free Trial</a>
            </div>

            {/* Premium */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>              <p className="text-gray-500 text-sm mb-6">For large businesses</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">₹1999<span className="text-lg text-gray-500 font-normal">/month</span></div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">✓ Unlimited orders</li>
                <li className="flex items-center gap-2">✓ Multi-user access</li>
                <li className="flex items-center gap-2">✓ Custom branding</li>
                <li className="flex items-center gap-2">✓ CSV export</li>
                <li className="flex items-center gap-2">✓ Priority support</li>
              </ul>
              <a href="/signup" className="block w-full text-center bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">Start Free Trial</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Digitize Your Business?</h2>
          <p className="text-xl text-blue-100 mb-8">Join hundreds of shops already growing with QuickCart. No hidden charges.</p>
          <a href="/signup" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-lg">
            🚀 Start Your Free Trial Today
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <span className="text-2xl font-bold text-white mb-4 block">QuickCart</span>
              <p className="text-sm max-w-xs">Digitize your shop. Take orders via Telegram, track sales, and grow your business effortlessly.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How it Works</a></li>
                <li><a href="/bot-setup" className="hover:text-white transition">Bot Setup Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: supportquickcart0gmail.com</li>
                <li>Phone: +91 98765 43210</li>
              </ul>
            </div>          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            © {new Date().getFullYear()} QuickCart. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
