import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper function to send messages
async function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.message) return NextResponse.json({ success: true });

    const chatId = body.message.chat.id;
    const text = body.message.text || '';
    const firstName = body.message.from.first_name || 'User';
    const lowerText = text.toLowerCase().trim();

    console.log('📩 New Message:', text);

    // 1. STRICT COMMAND CHECK: Agar '/' se shuru hota hai, toh Help message bhejo aur ruk jao (DB mein save mat karo)
    if (lowerText.startsWith('/')) {
      await sendTelegramMessage(chatId, "👋 *Welcome to QuickCart!*\n\nPlease send your order in this format:\n*Order: [items], total: [amount], [city], [phone]*\n\n_Example:_\nOrder: 2kg sugar, 1kg daal, total: 350, Delhi, 9876543210");
      return NextResponse.json({ success: true });
    }

    // 2. GREETINGS / RANDOM CHAT CHECK: In words ko order mat maano
    const ignoreWords = ['hi', 'hello', 'help', 'me hoon', 'test', 'ok', 'thanks', 'thank you', 'namaste', 'hey'];
    if (ignoreWords.some(word => lowerText === word || lowerText.includes(word))) {
      await sendTelegramMessage(chatId, "👋 Hi! Please send your order details like this:\n*Order: 2kg sugar, total: 350, Delhi, 9876543210*");
      return NextResponse.json({ success: true });
    }

    // 3. BASIC VALIDATION: Agar message bahut chhota hai aur usme koi number nahi hai, toh ye order nahi ho sakta
    const hasNumber = /\d/.test(text);
    if (text.length < 10 && !hasNumber) {
      await sendTelegramMessage(chatId, "⚠️ I didn't understand that. Please send your order like this:\n*Order: 2kg sugar, total: 350, Delhi, 9876543210*");
      return NextResponse.json({ success: true });
    }

    // --- AB SE SIRF VALID ORDERS HI PROCESS HONGE ---

    // 4. SMART Amount Extraction
    let amount = 0;
    const totalMatch = text.match(/(?:total|Total|amount|Amount)\s*:?\s*(\d+)/i);
    if (totalMatch) {
      amount = parseInt(totalMatch[1], 10);
    } else {
      const numbers = text.match(/\d+/g);
      if (numbers) {
        const validNumbers = numbers.map(n => parseInt(n, 10)).filter(n => n >= 50); // Min order value 50 maan rahe hain
        if (validNumbers.length > 0) {
          amount = Math.max(...validNumbers);
        }
      }
    }

    // 5. SMART Phone Extraction
    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    // 6. SMART Items Extraction
    let cleanItems = text;
    cleanItems = cleanItems.replace(/Order:\s*/i, '');
    cleanItems = cleanItems.replace(/(?:total|Total|amount|Amount)\s*:?\s*\d+/i, '');
    cleanItems = cleanItems.replace(/,\s*\d{10}/, '');
    cleanItems = cleanItems.replace(/,\s*(Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i, '');
    cleanItems = cleanItems.replace(/,\s*$/, '').trim();
    cleanItems = cleanItems.replace(/^\s*,\s*/, '').trim();
    
    const finalItems = cleanItems.length > 5 ? cleanItems : text;
    const cityMatch = text.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
    const address = cityMatch ? cityMatch[0] : 'Not provided';

    console.log('💰 Extracted Amount:', amount, '| 📦 Extracted Items:', finalItems);

    // 7. Database Mein Save Karo
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
          address: address,
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

    // 8. User Ko Clean Success Reply Bhejo
    if (BOT_TOKEN && orderId) {
      const trackingLink = `https://quickcart-dashboard-ten.vercel.app/track/${orderId}`;
      const reply = `✅ *Order Received!*\n\n📦 *Items:*\n• ${finalItems}\n\n💰 *Total: ₹${amount}*\n📍 *Address: ${address}*\n📞 *Phone: ${phone || 'Not provided'}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Shop will contact you soon!`;

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
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
