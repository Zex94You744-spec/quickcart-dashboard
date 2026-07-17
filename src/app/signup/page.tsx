'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    shopName: '', 
    phone: '', 
    email: '', 
    password: '', // 👈 Password field add kiya
    plan: 'pro' 
  });

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) // Password bhi ab backend ko jayega
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/checkout?lead_id=${result.data.id}`);
        }, 2000);
      } else {
        alert('Error: ' + (result.error || 'Something went wrong'));
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Congratulations!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Your <span className="font-bold text-blue-600">7-day free trial</span> has been activated!
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left rounded-r-lg">
            <p className="font-semibold text-blue-900">Redirecting to Checkout...</p>
            <p className="text-sm text-blue-700 mt-1">
              You will be redirected to the checkout page in 2 seconds to confirm your plan.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            If you are not redirected, <a href="/landing" className="text-blue-600 underline">click here</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">7 days free + First month 50% off</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
            <input 
              type="text" 
              required
              value={formData.shopName}
              onChange={(e) => setFormData({...formData, shopName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Rahul General Store"
            />          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="rahul@example.com"
            />
          </div>
          
          {/* 👈 YE NAYA PASSWORD FIELD HAI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Create Password *</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Min. 6 characters"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 mt-6"
          >
            {loading ? 'Creating Account...' : '🚀 Start 7-Day Free Trial'}
          </button>

          <a 
            href="/landing"
            className="block text-center text-gray-600 hover:text-gray-900 mt-4"
          >            ← Back to Home
          </a>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>✓ No credit card required</p>
          <p>✓ 7 days completely free</p>
          <p>✓ First month 50% off</p>
        </div>
      </div>
    </div>
  );
}
