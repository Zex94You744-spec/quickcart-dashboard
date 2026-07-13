import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    
    // Webhook signature verify kar
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    
    // Payment captured event
    if (event.event === 'payment.captured') {
      const { lead_id, plan } = event.payload.payment.entity.notes;
      
      // Supabase se connect kar
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Lead update kar
      await supabase.from('leads').update({
        subscription_status: 'active',
        regular_price_start_date: new Date().toISOString()
      }).eq('id', lead_id);

      // Customer ko success notification
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (lead) {
          const message = `✅ *Payment Successful!*\n\n🎉 Thank you ${lead.name}!\n\nYour QuickCart subscription is now ACTIVE!\n\n💰 Plan: ${plan}\n💸 Amount Paid: Rs.${event.payload.payment.entity.amount / 100}\n\n🚀 Your bot is ready to use!\n\nDashboard: https://quickcart-dashboard-ten.vercel.app/login`;
          
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: lead.phone,
              text: message,
              parse_mode: 'Markdown'
            })
          });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
