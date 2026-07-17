'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Form submit hone par success message dikhayenge
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Received!</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            To ensure the security of your account, please contact our support team at:
            <br />
            <a href="mailto:support@quickcart.com" className="text-blue-600 font-semibold hover:underline mt-2 inline-block">
              support@quickcart.com
            </a>
            <br />
            <span className="text-sm text-gray-500 mt-2 block">
              Please mention your registered email: <strong>{email}</strong>
            </span>
          </p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition w-full"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600 text-sm">
            Enter your registered email address and our team will help you reset it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              placeholder="supportquickcart0@gmail.com"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Request Password Reset
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
