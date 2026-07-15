'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    discountedPrice: 249,
    description: 'Chhote shops aur shuruat ke liye perfect',
    features: [
      '✅ 50 Orders per month',
      '✅ Basic Dashboard & Analytics',
      '✅ Auto PDF Invoices',
      '✅ Telegram Order Notifications',
      '❌ CSV Export',
      '❌ Priority Support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    discountedPrice: 499,
    description: 'Growing businesses ke liye best value',
    popular: true,
    features: [
      '✅ Unlimited Orders',
      '✅ Advanced Sales Analytics',
      '✅ Auto PDF Invoices with GST',
      '✅ Live Order Tracking Link',
      '✅ CSV Export for Accounting',
      '✅ Email & Chat Support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    discountedPrice: 999,
    description: 'Large businesses aur multi-user ke liye',
    features: [
      '✅ Everything in Pro',
      '✅ Multi-user Staff Access',      '✅ Custom Branding (Your Logo)',
      '✅ Priority 24/7 Support',
      '✅ Advanced API Access',
      '✅ Dedicated Account Manager'
    ]
  }
];

export default function CheckoutPage() {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // User ko koi bhi plan select karne ki freedom do
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('lead_id');
      setLeadId(id);
      if (id) {
        fetchLead(id);
      } else {
        setLoading(false);
      }
    }
  }, []);

  async function fetchLead(id: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setLead(data);
      // Default selected plan wo hoga jo user ne signup pe choose kiya tha
      setSelectedPlanId(data.subscription_plan || 'pro');
    }
    setLoading(false);
  }

  async function handlePayment(planId: string) {
    if (!leadId) return;
    setProcessing(true);
    try {
      const response = await fetch('/api/payment', {        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, plan: planId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        window.location.href = result.paymentUrl;
      } else {
        alert('❌ Error: ' + (result.error || 'Failed to create payment link'));
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('❌ Failed to generate payment link.');
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600 animate-pulse">Loading your checkout details...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Invalid Link</h2>
          <p className="text-gray-600 mt-2">Please contact support or go back to the dashboard.</p>
          <a href="/admin/leads" className="mt-4 inline-block text-blue-600 hover:underline">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  const isDiscounted = lead.subscription_status === 'discounted';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Subscription</h1>
          <p className="text-lg text-gray-600">
            Review your plan details and proceed to secure payment.          </p>
          <div className="mt-4 inline-flex items-center bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
            <span className="text-blue-800 font-medium">👤 {lead.name}</span>
            <span className="mx-2 text-blue-300">|</span>
            <span className="text-blue-800 font-medium">🏪 {lead.shop_name}</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const displayPrice = isDiscounted ? plan.discountedPrice : plan.price;
            const originalPrice = isDiscounted ? plan.price : null;

            return (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)} // 👈 Click karne par plan select ho jayega
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                  isSelected ? 'border-blue-600 ring-4 ring-blue-100 scale-105 z-10' : 'border-gray-100 hover:border-gray-300 hover:shadow-xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                {isSelected && isDiscounted && (
                  <div className="absolute -top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    🎉 50% OFF APPLIED
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    {originalPrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">₹{displayPrice}</span>
                        <span className="text-lg text-gray-400 line-through">₹{originalPrice}</span>
                        <span className="text-sm text-gray-500">/month</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">₹{displayPrice}</span>
                        <span className="text-sm text-gray-500">/month</span>
                      </div>                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="mr-2">{feature.startsWith('✅') ? '✅' : '❌'}</span>
                        <span>{feature.substring(2)}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Card click event ko rokna taaki button alag se kaam kare
                      handlePayment(plan.id);
                    }}
                    disabled={processing}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {processing && isSelected ? 'Processing...' : isSelected ? 'Proceed to Pay' : 'Choose Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="text-center border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 mb-4">🔒 Secured by Razorpay | 100% Safe & Encrypted</p>
          <div className="flex justify-center gap-6 text-gray-400 flex-wrap">
            <span>💳 UPI / Cards / Net Banking</span>
            <span>📜 GST Invoice Provided</span>
            <span>🔄 Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
