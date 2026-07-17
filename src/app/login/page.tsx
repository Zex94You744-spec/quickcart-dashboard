'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 👇 YAHAN APNA ADMIN EMAIL DAAL DENA (Jisse tum admin dashboard access karoge)
const ADMIN_EMAIL = 'devbusines01@gmail.com'; 

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // 1. ADMIN CHECK (Direct & 100% Working - Database par depend nahi karta)
    const ADMIN_EMAIL = 'devbusines01@gmail.com';
    const ADMIN_PASSWORD = 'TaYOpc9THewup94D6429qC3vxe+fZFKp';

    if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      localStorage.setItem('userEmail', formData.email);
      document.cookie = "isAdmin=true; path=/; max-age=86400"; // Admin cookie set kiya
      router.push('/admin/leads');
      setLoading(false);
      return;
    }

    // 2. NORMAL USER CHECK (Database se)
    try {
      const { data: userData, error } = await supabase
        .from('leads')
        .select('email, password')
        .eq('email', formData.email)
        .single();

      if (error || !userData) {
        alert('Account not found. Please sign up first.');
        setLoading(false);
        return;
      }

      if (userData.password !== formData.password) {
        alert('Incorrect password! Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('userEmail', formData.email);
      document.cookie = "isAdmin=false; path=/; max-age=86400"; // Normal user cookie
      router.push('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your QuickCart account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              placeholder="supportquickcart0@gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
              placeholder="contact on email"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Remember me
            </label>
            <a href="/bot-setup" className="text-blue-600 hover:text-blue-800 font-medium">Need Help?</a>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : '🔐 Login to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
            Start Free Trial
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <a href="/landing" className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
