'use client';
import { useState } from 'react';

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', shopName: '', phone: '', email: '' });

  const handleSignup = (e: any) => {
    e.preventDefault();
    alert('Thank you! Hum aapse jaldi contact karenge.');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">QuickCart</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600">How it Works</a>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Apne Shop Ko <span className="text-blue-600">Digital</span> Banayein
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Telegram se orders lein, automatic invoices banayein, aur sales track karein. 
              Sab kuch ek hi jagah pe!
            </p>
            <div className="flex justify-center gap-4">
              <button                 onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                🚀 7 Din Free Trial Shuru Karein
              </button>
              <a 
                href="#how-it-works"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-blue-600"
              >
                ▶️ Demo Dekhein
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ✅ Koi credit card nahi chahiye   ✅ 7 din free   ✅ Pehla mahina 50% off
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Sab Kuch Jo Aapko Chahiye</h2>
            <p className="text-xl text-gray-600">Ek complete solution aapke business ke liye</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2">Telegram Orders</h3>
              <p className="text-gray-600">Customers Telegram pe order bhejein, AI automatically extract karega</p>
            </div>
            
            <div className="bg-green-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4"></div>
              <h3 className="text-xl font-bold mb-2">Sales Analytics</h3>
              <p className="text-gray-600">Real-time charts aur graphs se apna business track karein</p>
            </div>
            
            <div className="bg-purple-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">🧾</div>
              <h3 className="text-xl font-bold mb-2">Auto PDF Invoices</h3>
              <p className="text-gray-600">Professional invoices automatically generate aur send honge</p>
            </div>
            
            <div className="bg-yellow-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-2">Order Tracking</h3>
              <p className="text-gray-600">Customers ko live tracking link bhejein</p>            </div>
            
            <div className="bg-red-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">GST Calculation</h3>
              <p className="text-gray-600">Automatic GST calculation aur reporting</p>
            </div>
            
            <div className="bg-indigo-50 p-8 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">📥</div>
              <h3 className="text-xl font-bold mb-2">CSV Export</h3>
              <p className="text-gray-600">Excel mein data export karein accounting ke liye</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Kaise Kaam Karta Hai?</h2>
            <p className="text-xl text-gray-600">3 simple steps mein shuru karein</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Sign Up Karein</h3>
              <p className="text-gray-600">7 din free trial ke liye register karein</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Bot Setup Karein</h3>
              <p className="text-gray-600">Hum aapka custom Telegram bot setup karenge</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Orders Lena Shuru Karein</h3>
              <p className="text-gray-600">Customers order bhejein, aap track karein</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-xl text-gray-600">7 din free trial + Pehla mahina 50% off!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl transition">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">Chhote shops ke liye</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹499</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> 50 orders/month</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Basic dashboard</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> PDF invoices</li>
                <li className="flex items-center text-gray-400"><span className="mr-2">✗</span> CSV export</li>
              </ul>
              <button 
                onClick={() => setShowModal(true)}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Start Free Trial
              </button>
            </div>

            <div className="border-2 border-blue-600 rounded-xl p-8 relative hover:shadow-xl transition transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">Growing businesses ke liye</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">999</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited orders</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Advanced dashboard</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> PDF invoices</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> CSV export</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Email support</li>
              </ul>
              <button 
                onClick={() => setShowModal(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Start Free Trial
              </button>            </div>

            <div className="border-2 border-gray-200 rounded-xl p-8 hover:shadow-xl transition">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-gray-600 mb-4">Large businesses ke liye</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹1999</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Unlimited orders</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Multi-user access</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Custom branding</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> CSV export</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Priority support</li>
              </ul>
              <button 
                onClick={() => setShowModal(true)}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          <div className="text-center mt-12 bg-yellow-50 p-6 rounded-xl">
            <p className="text-lg font-semibold text-gray-900">
              🎉 Special Offer: 7 Din Free Trial + Pehla Mahina 50% Off!
            </p>
            <p className="text-gray-600 mt-2">
              Trial ke baad automatic normal pricing pe shift hoga. Koi hidden charges nahi.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Aaj Hi Shuru Karein!</h2>
          <p className="text-xl text-blue-100 mb-8">
            7 din free trial + Pehla mahina 50% discount
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            🚀 Free Trial Shuru Karein
          </button>
        </div>      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">QuickCart</h3>
              <p className="text-gray-400">
                Apne shop ko digital banayein. Telegram se orders lein, track karein, aur grow karein.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white">How it Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">
                Email: support@quickcart.com<br />
                Phone: +91 XXXXX XXXXX
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 QuickCart. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Signup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Start Your Free Trial</h2>
            <p className="text-gray-600 mb-6">7 din free + Pehla mahina 50% off</p>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aapka Naam</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Ka Naam</label>
                <input 
                  type="text" 
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Start Free Trial
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}    </div>
  );
}
