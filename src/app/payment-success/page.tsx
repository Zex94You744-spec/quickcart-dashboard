'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PaymentSuccessPage() {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    // Sirf naam aur shop ka naam fetch karte hain, koi price ya admin data nahi
    const { data } = await supabase
      .from('leads')
      .select('name, shop_name')
      .eq('id', id)
      .single();
    
    if (data) setLead(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600 animate-pulse">Verifying your payment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center border border-green-100">        
        {/* Success Animation Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Payment Successful! 🎉
        </h1>
        
        {lead ? (
          <p className="text-lg text-gray-600 mb-8">
            Thank you, <span className="font-semibold text-gray-900">{lead.name}</span>! <br/>
            Your subscription for <span className="font-semibold text-gray-900">{lead.shop_name}</span> is now active.
          </p>
        ) : (
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your payment! Your subscription is now active.
          </p>
        )}

        {/* Next Steps Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-8 text-left rounded-r-lg">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">What happens next?</h3>
          <ul className="space-y-3 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-3 text-lg">✅</span>
              <span>You will receive a confirmation message shortly.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-lg">✅</span>
              <span>Our team will contact you within 24 hours to set up your custom Telegram bot.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-lg">✅</span>
              <span>You can start managing your digital orders seamlessly.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="https://wa.me/919876543210" 
            target="_blank"
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
          >
            <span>💬</span> Contact Support          </a>
          <a 
            href="/landing"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <span>🏠</span> Back to Home
          </a>
        </div>
        
        <p className="text-xs text-gray-400 mt-8">
          Transaction ID will be sent to your registered email/phone.
        </p>
      </div>
    </div>
  );
}
