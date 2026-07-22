import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ NEW: Dynamic bot token se message bhejne ka function
async function sendTelegramMessage(botToken, chatId, text) {
  if (!botToken) {
    console.error(' Bot token missing for this shop');
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    if (!result.ok) {
      console.error('❌ Telegram send error:', result.description);
      return false;
    }
    return true;
  } catch (error) {
    console.error(' Telegram API error:', error);
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.message) return NextResponse.json({ success: true });

    const chatId = body.message.chat.id;
    const text = body.message.text || '';
    const firstName = body.message.from.first_name || 'User';
    const lowerText = text.toLowerCase().trim();

    // 🎯 1. URL se Bot Token nikalo
    const { searchParams } = new URL(request.url);
    const incomingBotToken = searchParams.get('token');
    
    // 🎯 2. Database se shop owner dhundho is token se
    let targetShopEmail = null;
    let shopBotToken = incomingBotToken; // Default: same token use karo

    if (incomingBotToken) {
      const { data: shopOwner } = await supabase
        .from('leads')
        .select('email, bot_token')
        .eq('bot_token', incomingBotToken)
        .single();
      
      if (shopOwner) {
        targetShopEmail = shopOwner.email;
        // Agar shop owner ne apna bot token set kiya hai, toh wahi use karo
        shopBotToken = shopOwner.bot_token || incomingBotToken;
        console.log('✅ Order routed to shop:', targetShopEmail);
      } else {
        console.log('⚠️ Bot token not found in database.');
      }
    }

    console.log('📩 New Message:', text);

    // 3. COMMANDS KO HANDLE KARO
    if (lowerText.startsWith('/')) {
      await sendTelegramMessage(shopBotToken, chatId, 
        `*Welcome to QuickCart!*\n\nPlease send your order in this format:\n*Order: [items], total: [amount], [city], [phone]*\n\n_Example:_\nOrder: 2kg sugar, 1kg daal, total: 350, Delhi, 9876543210`
      );
      return NextResponse.json({ success: true });
    }

    // 4. GREETINGS CHECK
    const ignoreWords = ['hi', 'hello', 'help', 'me hoon', 'test', 'ok', 'thanks', 'thank you', 'namaste', 'hey'];
    const hasIgnoreWord = ignoreWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
    
    const isLikelyOrder = lowerText.includes('total') || lowerText.includes('order:') || /\d{10}/.test(text) || (lowerText.includes('kg') && /\d+/.test(text));

    if (!isLikelyOrder && (hasIgnoreWord || lowerText.length < 5)) {
      await sendTelegramMessage(shopBotToken, chatId, 
        `👋 Hi! Please send your order details like this:\n*Order: 2kg sugar, total: 350, Delhi, 9876543210*`
      );
      return NextResponse.json({ success: true });
    }

    // 5. SMART EXTRACTION
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

    // 6. DATABASE INSERT
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
          shop_owner_email: targetShopEmail
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

    // 7. REPLY TO CUSTOMER (Usi shop ke bot se!)
    if (orderId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
      const trackingLink = `${appUrl}/track/${orderId}`;
      
      const reply = `✅ *Order Received!*\n\n📦 *Items:*\n• ${finalItems}\n\n💰 *Total: ₹${amount}*\n📍 *Address: ${address}*\n📞 *Phone: ${phone || 'Not provided'}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Shop will contact you soon!`;

      await sendTelegramMessage(shopBotToken, chatId, reply);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
