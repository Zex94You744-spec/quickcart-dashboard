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
    console.log('🔵 Login attempt started for:', email);
    setLoading(true);
    setError('');

    try {
      // 1. User ko database mein dhundo
      console.log('🔵 Fetching user from database...');
      const { data: userData, error: userError } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email.trim()) // .trim() se accidental spaces hat jayenge
        .single();

      if (userError || !userData) {
        console.log('🔴 User not found or error:', userError);
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      console.log('🟢 User found:', userData.email);
      console.log('🟢 DB Password:', userData.password, '| Input Password:', password);

      // 2. Password verify karo (Case-sensitive aur spaces hata kar)
      const dbPass = String(userData.password).trim();
      const inputPass = String(password).trim();

      if (dbPass !== inputPass) {
        console.log('🔴 Password mismatch!');
        setError('Invalid email or password');
        setLoading(false);
        return;      }

      console.log('🟢 Password matched!');

      // 3. Email ko localStorage mein save karo
      localStorage.setItem('userEmail', email.trim());
      console.log('🟢 Email saved to localStorage');

      // 4. ROLE-BASED REDIRECT
      if (userData.role === 'admin' || email.trim() === 'admin@quickcart.com') {
        console.log('🟢 Redirecting to Admin Dashboard...');
        router.push('/admin/dashboard');
      } else {
        console.log('🟢 Redirecting to User Dashboard...');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('🔴 CRITICAL ERROR:', err);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : '🔐 Login to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  );
}
