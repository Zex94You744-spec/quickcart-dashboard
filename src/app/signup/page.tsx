'use client';
import { useState } from 'react';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    shopName: '', 
    phone: '', 
    email: '', 
    plan: 'pro' 
  });

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          shopName: formData.shopName,
          phone: formData.phone,
          email: formData.email,
          plan: formData.plan
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        alert('Error: ' + (result.error || 'Kuch gadbad ho gayi'));
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Congratulations!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Aapka <span className="font-bold text-blue-600">7-day free trial</span> activate ho gaya hai!
          </p>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 text-left">
            <p className="font-semibold text-green-800">Ab kya hoga?</p>
            <ul className="mt-2 space-y-1 text-green-700">
              <li>✓ Hum aapse 24 ghante mein contact karenge</li>
              <li>✓ Aapka custom Telegram bot setup hoga</li>
              <li>✓ Dashboard access mil jayega</li>
              <li>✓ Pehla mahina 50% discount milega</li>
            </ul>
          </div>
          <a 
            href="/landing"
            className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Free Trial</h1>
          <p className="text-gray-600">7 din free + Pehla mahina 50% off</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aapka Naam *</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Rahul Kumar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Ka Naam *</label>
            <input 
              type="text" 
              required              value={formData.shopName}
              onChange={(e) => setFormData({...formData, shopName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Rahul General Store"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input 
              type="tel" 
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="rahul@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Choose Plan *</label>
            <select
              required
              value={formData.plan}
              onChange={(e) => setFormData({...formData, plan: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="starter">Starter - ₹499/month</option>
              <option value="pro">Pro - ₹999/month (Most Popular)</option>
              <option value="premium">Premium - ₹1999/month</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">🎁 Pehla mahina 50% OFF!</p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 mt-6"
          >
            {loading ? 'Processing...' : '🚀 Start 7-Day Free Trial'}
          </button>
          <a 
            href="/landing"
            className="block text-center text-gray-600 hover:text-gray-900 mt-4"
          >
            ← Back to Home
          </a>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>✓ Koi credit card nahi chahiye</p>
          <p>✓ 7 din bilkul free</p>
          <p>✓ Pehla mahina 50% off</p>
        </div>
      </div>
    </div>
  );
}
