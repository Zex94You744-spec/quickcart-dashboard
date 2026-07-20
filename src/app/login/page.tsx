'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // --- ADMIN BYPASS ---
      if (email.trim() === 'devbusines01@gmail.com' && password === 'TaYOpc9THewup94D6429qC3vxe+fZFKp') {
        console.log('✅ Admin login successful');
        localStorage.setItem('userEmail', 'devbusines01@gmail.com');
        localStorage.setItem('userRole', 'admin');
        
        // Small delay to ensure localStorage is saved before redirect
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.replace('/admin/dashboard');
        return;
      }
      // ---------------------

      // --- REGULAR USER LOGIN ---
      const { data: userData, error: userError } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (String(userData.password).trim() !== String(password).trim()) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Login successful
      localStorage.setItem('userEmail', email.trim());
      localStorage.setItem('userRole', userData.role || 'user');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (userData.role === 'admin' || email.includes('admin') || email.includes('support')) {
        window.location.replace('/admin/dashboard');
      } else {
        window.location.replace('/dashboard');
      }

    } catch (err: any) {
      setError('An error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">QuickCart</h1>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-1">Login to your QuickCart dashboard</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
            {/* 👇 FORGOT PASSWORD LINK ADDED HERE 👇 */}
            <div className="flex justify-end mt-2">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              '🔐 Login to Dashboard'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  );
}
