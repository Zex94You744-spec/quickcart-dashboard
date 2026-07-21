'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    description: 'Perfect for small shops and startups',
    features: ['50 Orders per month', 'Basic Dashboard & Analytics', 'Auto PDF Invoices', 'Telegram Order Notifications'],
    missing: ['CSV Export', 'Priority Support'],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    description: 'Best value for growing businesses',
    features: ['Unlimited Orders', 'Advanced Sales Analytics', 'Auto PDF Invoices with GST', 'Live Order Tracking Link', 'CSV Export for Accounting', 'Email & Chat Support'],
    missing: [],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    description: 'For large businesses and multi-user teams',
    features: ['Everything in Pro', 'Multi-user Staff Access', 'Custom Branding (Your Logo)', 'Priority 24/7 Support', 'Advanced API Access', 'Dedicated Account Manager'],
    missing: [],
    popular: false
  }
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead_id');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ SAFE: window check ke sath localStorage access
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    
    if (email && leadId) {
      supabase.from('leads').select('*').eq('id', leadId).single().then(({ data }) => {
        if (data) {
          setUser(data);
        } else {
          router.push('/login');
        }
      });
    } else if (!email) {
      router.push('/login');
    }
  }, [leadId, router]);

  async function handlePayment(planId: string, amount: number) {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: user.id, amount, plan: planId, email: user.email })
      });
      const data = await res.json();
      
      if (data.success) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount * 100,
          currency: "INR",
          name: "QuickCart",
          description: `${planId.toUpperCase()} Plan Subscription`,
          order_id: data.orderId,
          handler: async function (response: any) {
            await fetch('/api/upgrade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email, paymentId: response.razorpay_payment_id, plan: planId })
            });
            alert('Payment Successful! Welcome to QuickCart Pro.');
            router.push('/dashboard');
          },
          prefill: { name: user.name, email: user.email, contact: user.phone },
          theme: { color: "#2563eb" }
        };
        
        // ✅ SAFE: window check ke sath Razorpay load
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          alert('Razorpay SDK not loaded. Please check your internet connection.');
        }
      } else {
        alert('Failed to create order: ' + data.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading checkout details...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Complete Your Subscription</h1>
          <p className="mt-4 text-xl text-gray-600">Review your plan details and proceed to secure payment.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>👤 {user.name}</span> | <span>🏪 {user.shop_name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-lg border ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} p-8 flex flex-col relative`}>
              {plan.popular && <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">MOST POPULAR</div>}
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-gray-600 text-sm">{plan.description}</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold">✅</span> {f}
                  </li>
                ))}
                {plan.missing.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="font-bold">❌</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePayment(plan.id, plan.price)}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Processing...' : (plan.popular ? 'Proceed to Pay' : 'Choose Plan')}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>🔒 Secured by Razorpay | 100% Safe & Encrypted</span>
            <span>💳 UPI / Cards / Net Banking</span>
            <span>📜 GST Invoice Provided</span>
            <span>🔄 Cancel Anytime</span>
          </div>
          
          {/* 👇 SKIP BUTTON 👇 */}
          <div className="pt-4 border-t border-gray-200 max-w-md mx-auto">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="text-sm text-gray-500 hover:text-blue-600 font-medium underline transition"
            >
              Skip for now & Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ MAIN EXPORT WITH SUSPENSE (Ye build error ko 100% fix karega)
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
