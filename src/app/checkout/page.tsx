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
    desc: 'Perfect for small shops and startups',
    features: ['50 Orders per month', 'Basic Dashboard & Analytics', 'Auto PDF Invoices', 'Telegram Order Notifications'],
    missing: ['CSV Export', 'Priority Support'],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    desc: 'Best value for growing businesses',
    features: ['Unlimited Orders', 'Advanced Sales Analytics', 'Auto PDF Invoices with GST', 'Live Order Tracking Link', 'CSV Export for Accounting', 'Email & Chat Support'],
    missing: [],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    desc: 'For large businesses and multi-user teams',
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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Load Razorpay Script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { 
      if (document.body.contains(script)) document.body.removeChild(script); 
    };
  }, []);

  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    if (email) {
      fetchUser(email);
    } else {
      router.push('/login');
    }
  }, []);

  async function fetchUser(email: string) {
    const { data } = await supabase.from('leads').select('*').eq('email', email).single();
    if (data) setUser(data);
    setLoading(false);
  }

  async function handlePayment(plan: any) {
    setProcessing(true);
    try {
      // 1. Backend se Razorpay Order ID generate karo
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, planId: plan.id })
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        alert('Failed to initialize payment: ' + orderData.error);
        setProcessing(false);
        return;
      }

      // 2. Razorpay Payment Modal Open Karo
      const options: any = {
        key: orderData.key,
        amount: orderData.amount, // Amount in paise
        currency: "INR",
        name: "QuickCart",
        description: `${plan.name} Plan Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Payment Successful hone par Backend se Verify karo
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: user.email,
                plan: plan.id
              })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              alert('Payment Successful! Your plan is now active.');
              router.push('/dashboard');
            } else {
              alert('Payment verification failed: ' + verifyData.error);
            }
          } catch (err) {
            alert('Something went wrong during verification.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setProcessing(false); // Agar user modal band kar de
          }
        }
      };

      // Check if Razorpay SDK is loaded
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        alert('Razorpay SDK not loaded. Please check your internet connection.');
        setProcessing(false);
      }

    } catch (error) {
      console.error("Payment error:", error);
      alert('Something went wrong. Please try again.');
      setProcessing(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">User not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Subscription</h1>
          <p className="mt-2 text-gray-600">Review your plan details and proceed to secure payment.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>👤 {user.name}</span> | <span>🏪 {user.shop_name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-sm border ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} p-8 flex flex-col relative`}>
              {plan.popular && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">MOST POPULAR</span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold">✅</span> {feat}
                  </li>
                ))}
                {plan.missing.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="font-bold">❌</span> {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePayment(plan)}
                disabled={processing}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing ? 'Processing...' : (plan.popular ? 'Proceed to Pay' : 'Choose Plan')}
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
          
          <div className="pt-4">
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
