import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
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

    // 🛑 1. SMART ROUTING: URL se Bot Token nikalo aur Shop Owner dhundho
    const { searchParams } = new URL(request.url);
    const incomingBotToken = searchParams.get('token');
    let targetShopEmail = null;

    if (incomingBotToken) {
      const { data: shopOwner } = await supabase
        .from('leads')
        .select('email')
        .eq('bot_token', incomingBotToken)
        .single();
      
      if (shopOwner) {
        targetShopEmail = shopOwner.email;
        console.log('✅ Order routed to shop:', targetShopEmail);
      } else {
        console.log('️ Bot token not found in database.');
      }
    }

    console.log(' New Message:', text);

    // 2. STRICT COMMAND CHECK
    if (lowerText.startsWith('/')) {
      await sendTelegramMessage(chatId, " *Welcome to QuickCart!*\n\nPlease send your order in this format:\n*Order: [items], total: [amount], [city], [phone]*\n\n_Example:_\nOrder: 2kg sugar, 1kg daal, total: 350, Delhi, 9876543210");
      return NextResponse.json({ success: true });
    }

    // 3. GREETINGS CHECK
    const ignoreWords = ['hi', 'hello', 'help', 'me hoon', 'test', 'ok', 'thanks', 'thank you', 'namaste', 'hey'];
    const hasIgnoreWord = ignoreWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
    
    const isLikelyOrder = lowerText.includes('total') || lowerText.includes('order:') || /\d{10}/.test(text) || (lowerText.includes('kg') && /\d+/.test(text));

    if (!isLikelyOrder && (hasIgnoreWord || lowerText.length < 5)) {
      await sendTelegramMessage(chatId, "👋 Hi! Please send your order details like this:\n*Order: 2kg sugar, total: 350, Delhi, 9876543210*");
      return NextResponse.json({ success: true });
    }

    // 4. SMART EXTRACTION
    let amount = 0;
    const totalMatch = text.match(/(?:total|Total|amount|Amount)\s*:?\s*(\d+)/i);
    if (totalMatch) {
      amount = parseInt(totalMatch[1], 10);
    } else {
      const numbers = text.match(/\d+/g);
      if (numbers) {
        const validNumbers = numbers.map(n => parseInt(n, 10)).filter(n => n >= 50);
        if (validNumbers.length > 0) amount = Math.max(...validNumbers);
      }
    }

    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

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

    console.log('💰 Amount:', amount, '| 📦 Items:', finalItems, '| 🏪 Owner:', targetShopEmail);

    // 5. DATABASE INSERT (With shop_owner_email)
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
          shop_owner_email: targetShopEmail // ✅ YEH HAI ASLI FIX!
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

    // 6. REPLY TO USER
    if (BOT_TOKEN && orderId) {
      const trackingLink = `https://quickcart-dashboard-ten.vercel.app/track/${orderId}`;
      const reply = `✅ *Order Received!*\n\n📦 *Items:*\n• ${finalItems}\n\n💰 *Total: ₹${amount}*\n📍 *Address: ${address}*\n📞 *Phone: ${phone || 'Not provided'}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Shop will contact you soon!`;
      await sendTelegramMessage(chatId, reply);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
