import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.message) {
      return NextResponse.json({ success: true });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text || '';
    const firstName = body.message.from.first_name || 'User';

    console.log('📩 New Message:', text);

    // 1. Bot Commands ko ignore karo
    if (text.trim().startsWith('/')) {
      console.log('⏭️ Ignoring command:', text);
      return NextResponse.json({ success: true });
    }

    // 2. SMART Amount Extraction (Pehle 'total' dhundho, warna sabse bada number lo)
    let amount = 0;
    const totalMatch = text.match(/(?:total|Total|amount|Amount)\s*:?\s*(\d+)/i);
    if (totalMatch) {
      amount = parseInt(totalMatch[1], 10);
    } else {
      // Fallback: Saare numbers nikalo aur jo 50 se bada ho, usme se sabse bada wala 'amount' maan lo
      const numbers = text.match(/\d+/g);
      if (numbers) {
        const validNumbers = numbers.map(n => parseInt(n, 10)).filter(n => n > 50);
        if (validNumbers.length > 0) {
          amount = Math.max(...validNumbers);
        }
      }
    }

    // 3. SMART Phone Extraction
    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    // 4. SMART Items Extraction (Raw text ko clean karo)
    let cleanItems = text;
    cleanItems = cleanItems.replace(/Order:\s*/i, ''); // 'Order:' hatao
    cleanItems = cleanItems.replace(/(?:total|Total|amount|Amount)\s*:?\s*\d+/i, ''); // 'total: 350' hatao
    cleanItems = cleanItems.replace(/,\s*\d{10}/, ''); // Phone number hatao
    cleanItems = cleanItems.replace(/,\s*(Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i, ''); // City hatao
    cleanItems = cleanItems.replace(/,\s*$/, '').trim(); // Aakhri comma hatao
    cleanItems = cleanItems.replace(/^\s*,\s*/, '').trim(); // Shuru ka comma hatao
    
    const finalItems = cleanItems.length > 5 ? cleanItems : text;

    console.log('💰 Extracted Amount:', amount, '| 📦 Extracted Items:', finalItems);

    // 5. Database Mein Save Karo
    let orderId = null;
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_name: firstName,
          customer_chat_id: chatId,
          items: finalItems,
          amount: amount,
          phone: phone,
          address: phoneMatch ? text.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i)?.[0] || 'Not provided' : 'Not provided',
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

    // 6. User Ko Clean Reply Bhejo
    if (BOT_TOKEN) {
      const trackingLink = orderId 
        ? `https://quickcart-dashboard-ten.vercel.app/track/${orderId}` 
        : `https://quickcart-dashboard-ten.vercel.app/track`;

      const reply = `✅ *Order Received!*\n\n📦 *Items:*\n• ${finalItems}\n\n💰 *Total: ₹${amount}*\n📍 *Address: ${phoneMatch ? text.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i)?.[0] || 'Not provided' : 'Not provided'}*\n📞 *Phone: ${phone || 'Not provided'}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Shop will contact you soon!`;

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
      console.error('❌ CRITICAL: TELEGRAM_BOT_TOKEN is missing!');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
