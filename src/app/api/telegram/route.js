import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Agar message nahi hai, toh kuch mat karo
    if (!body.message) {
      return NextResponse.json({ success: true });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text || '';
    const firstName = body.message.from.first_name || 'User';

    console.log(' New Message:', text);

    // 1. Bot Commands (/start, /subscribe) ko ignore karo
    if (text.trim().startsWith('/')) {
      console.log('⏭️ Ignoring command:', text);
      return NextResponse.json({ success: true });
    }

    // 2. Simple Amount aur Phone Extraction (Jo crash na ho)
    let amount = 0;
    const amountMatch = text.match(/(\d+)/);
    if (amountMatch) amount = parseInt(amountMatch[1]);

    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    // 3. Database Mein Save Karo (Safe Try-Catch)
    let orderId = null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: firstName,
          customer_chat_id: chatId,
          items: text.replace(/Order:\s*/i, '').trim(),
          amount: amount,
          phone: phone,
          status: 'Pending',
          shop_owner_email: null 
        })
        .select();

      if (error) {
        console.error('❌ DB Error:', error.message);
      } else if (data && data[0]) {
        orderId = data[0].id;
        console.log('✅ Order saved:', orderId);
      }
    } catch (dbErr) {
      console.error('❌ DB Crash:', dbErr);
    }

    // 4. User Ko Reply Bhejo (Ye hamesha chalega, chahe DB fail ho jaye)
    if (BOT_TOKEN) {
      const trackingLink = orderId 
        ? `https://quickcart-dashboard-ten.vercel.app/track/${orderId}` 
        : `https://quickcart-dashboard-ten.vercel.app/track`;

      const reply = `✅ *Order Received!*\n\n📦 *Items:*\n${text}\n\n *Total: ₹${amount}*\n *Phone: ${phone || 'Not provided'}*\n\n🔗 *Track:*\n${trackingLink}\n\nShop will contact you soon!`;

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown'
        })
      });

      if (!tgRes.ok) {
        console.error('❌ Telegram API Error:', await tgRes.text());
      }
    } else {
      console.error('❌ CRITICAL: TELEGRAM_BOT_TOKEN is missing in Vercel Env Variables!');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
