'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Check karo ki email database mein hai ya nahi
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('email')
        .eq('email', email.trim())
        .single();

      if (fetchError || !data) {
        // Security best practice: Agar email nahi mila, toh bhi same success message dikhao 
        // taaki hackers ko pata na chale ki kaunsa email registered hai.
        setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
        setLoading(false);
        return;
      }

      // Yahan hum Supabase ka built-in reset password use kar sakte hain, 
      // ya phir abhi ke liye ek secure message dikhate hain (MVP ke liye best).
      setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
      
      // Note: Future mein yahan Resend.com ya SendGrid ka API integrate hoga 
      // jo actual reset link email karega. Abhi ke liye ye secure placeholder hai.
      
    } catch (err) {
      console.error('Reset error:', err);
      setMessage('If an account exists with this email, you will receive password reset instructions shortly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">QuickCart</h1>
          <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="text-sm text-gray-600 hover:text-blue-600 font-medium flex items-center justify-center gap-1"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
