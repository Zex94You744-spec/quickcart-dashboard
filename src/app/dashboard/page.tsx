'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo ke liye, hum localStorage se email le rahe hain (Real app mein Supabase Auth use hoga)
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    
    if (email) {
      fetchUser(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchUser(email: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .single();

    if (data) {
      setUser(data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading your dashboard...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">User not found. <a href="/login" className="text-blue-600 underline ml-2">Login again</a></div>;
  }

  const isPaid = user.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.name}! 👋</h1>
          <p className="text-gray-600">{user.shop_name}</p>
          
          <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Current Plan: <span className="ml-2 uppercase">{user.subscription_plan || 'Pro'}</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Subscription Status</h2>
          
          {isPaid ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Active & Ready!</h3>
              <p className="text-gray-600 mb-6">Your payment is successful. You can now set up your bot.</p>
              <a 
                href="/bot-setup" 
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                ⚙️ Setup Your Telegram Bot
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-bold text-orange-600 mb-2">
                {user.subscription_status === 'trial' ? 'Trial Active' : 'Payment Pending'}
              </h3>
              <p className="text-gray-600 mb-6">
                {user.subscription_status === 'trial' 
                  ? 'Your 7-day free trial is active. Complete your payment to unlock all features.' 
                  : 'Please complete your payment to activate your subscription.'}
              </p>
              <a 
                href={`/checkout?lead_id=${user.id}`} 
                className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg"
              >
                💳 Complete Payment Now
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center">          <a href="/landing" className="text-gray-600 hover:text-gray-900 font-medium">← Back to Home</a>
          <button 
            onClick={() => {
              localStorage.removeItem('userEmail');
              router.push('/login');
            }}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
