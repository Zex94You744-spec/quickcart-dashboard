import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PRICING = {
  starter: { regular: 499, discounted: 249 },
  pro: { regular: 999, discounted: 499 },
  premium: { regular: 1999, discounted: 999 }
};

function getPrice(plan, priceType) {
  const planPricing = PRICING[plan] || PRICING.pro;
  return planPricing[priceType];
}

export async function POST(request) {
  try {
    const { leadId, plan } = await request.json();
    
    if (!leadId || !plan) {
      return NextResponse.json(
        { success: false, error: 'Lead ID and plan required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const isDiscounted = lead.subscription_status === 'discounted';
    const price = getPrice(plan, isDiscounted ? 'discounted' : 'regular');
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
    
      // Razorpay Payment Link Create Kar
    const paymentLink = await razorpay.paymentLink.create({
      amount: price * 100, // Amount in paise
      currency: 'INR',
      accept_partial: false,
      description: `QuickCart Subscription - ${planName} ${isDiscounted ? '(50% OFF)' : ''}`,
      customer: {
        name: lead.name,
        contact: lead.phone,
        email: lead.email
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: true,
      notes: {
        lead_id: lead.id,
        shop_name: lead.shop_name,
        plan: planName,
        subscription_type: isDiscounted ? 'First Month (50% OFF)' : 'Regular'
      },
      // 👇 YE 2 LINES ADD KAR (Redirect ke liye)
      callback_url: `https://quickcart-dashboard-ten.vercel.app/payment-success?lead_id=${lead.id}`,
      callback_method: 'get'
    });

    // Sirf payment URL return karo, koi Telegram code nahi
    return NextResponse.json({ 
      success: true, 
      paymentUrl: paymentLink.short_url,
      paymentId: paymentLink.id,
      amount: price
    });
  } catch (error) {
    console.error('Payment Link Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
