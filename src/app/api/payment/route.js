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

export async function POST(request) {
  try {
    const { leadId, plan } = await request.json();
    
    if (!leadId || !plan) {
      return NextResponse.json(
        { success: false, error: 'Lead ID and plan required' },
        { status: 400 }
      );
    }

    // Lead details fetch kar
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Price calculate kar
    const isDiscounted = lead.subscription_status === 'discounted';
    const price = isDiscounted ? PRICING[plan].discounted : PRICING[plan].regular;
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
    
    // Payment link create kar
    const payment = await razorpay.orders.create({
      amount: price * 100, // Amount in paise
      currency: 'INR',
      receipt: `quickcart_${lead.id}_${Date.now()}`,
      notes: {
        lead_id: lead.id,
        lead_name: lead.name,
        shop_name: lead.shop_name,
        plan: planName,
        subscription_type: isDiscounted ? 'First Month (50% OFF)' : 'Regular'
      }
    });

    // Payment link URL
    const paymentUrl = payment.short_url || `https://razorpay.com/order/${payment.id}`;

    // Customer ko Telegram pe payment link bhejo
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken && lead.phone) {
      const message = `💳 *Payment Link - QuickCart*\n\n👤 Name: ${lead.name}\n🏪 Shop: ${lead.shop_name}\n\n💰 Plan: ${planName} ${isDiscounted ? '(50% OFF Applied!)' : ''}\n Amount: Rs.${price}\n\n Payment Link: ${paymentUrl}\n\n⏰ Valid for 24 hours\n\nThank you for choosing QuickCart! `;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: lead.phone,
          text: message,
          parse_mode: 'Markdown'
        })
      }).catch(e => console.error('Telegram notification failed:', e));
    }

    return NextResponse.json({ 
      success: true, 
      paymentUrl,
      orderId: payment.id,
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
