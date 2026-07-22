import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendTelegramMessage(botToken, chatId, text, parseMode = 'Markdown') {
  if (!botToken) return false;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode })
    });
    return response.ok;
  } catch (error) {
    console.error('Telegram error:', error);
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

    const { searchParams } = new URL(request.url);
    const incomingBotToken = searchParams.get('token');
    
    let targetShopEmail = null;
    let shopBotToken = incomingBotToken;

    if (incomingBotToken) {
      const { data: shopOwner } = await supabase
        .from('leads')
        .select('email, bot_token, subscription_plan')
        .eq('bot_token', incomingBotToken)
        .single();
      
      if (shopOwner) {
        targetShopEmail = shopOwner.email;
        shopBotToken = shopOwner.bot_token || incomingBotToken;
      }
    }

    // Commands
    if (lowerText.startsWith('/')) {
      await sendTelegramMessage(shopBotToken, chatId, 
        `*Welcome!* Send order like this:\n*Order: 2kg sugar, total: 350, Delhi, 9876543210*`
      );
      return NextResponse.json({ success: true });
    }

    // Order detection
    const isLikelyOrder = lowerText.includes('total') || lowerText.includes('order:') || /\d{10}/.test(text);

    if (!isLikelyOrder) {
      await sendTelegramMessage(shopBotToken, chatId, 
        `👋 Please send order like:\n*Order: 2kg sugar, total: 350, Delhi, 9876543210*`
      );
      return NextResponse.json({ success: true });
    }

    // Extract data
    let amount = 0;
    const totalMatch = text.match(/(?:total|Total)\s*:?\s*(\d+)/i);
    if (totalMatch) amount = parseInt(totalMatch[1], 10);

    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';

    let cleanItems = text.replace(/Order:\s*/i, '')
      .replace(/(?:total|Total)\s*:?\s*\d+/gi, '')
      .replace(/,\s*\d{10}/, '')
      .replace(/,\s*(Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/gi, '')
      .replace(/,\s*$/, '').trim();
    
    const cityMatch = text.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
    const address = cityMatch ? cityMatch[0] : 'Not provided';

    // ✅ DUPLICATE CHECK (Last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_chat_id', chatId)
      .eq('amount', amount)
      .eq('items', cleanItems)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .single();

    if (existingOrder) {
      console.log('⚠️ Duplicate order - ignored');
      return NextResponse.json({ success: true, message: 'Duplicate' });
    }

    // Save order
    let orderId = null;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name: firstName,
        customer_chat_id: chatId,
        items: cleanItems,
        amount: amount,
        phone: phone,
        address: address,
        status: 'Pending',
        shop_owner_email: targetShopEmail
      })
      .select();

    if (data && data[0]) {
      orderId = data[0].id;
    }

    // Reply to customer
    if (orderId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
      const trackingLink = `${appUrl}/track/${orderId}`;
      
      const reply = `✅ *Order Received!*\n\n📦 *Items:*\n• ${cleanItems}\n\n💰 *Total: ₹${amount}*\n📍 *Address: ${address}*\n *Phone: ${phone}*\n\n *Track:*\n${trackingLink}\n\n💾 Shop will contact you soon!`;

      await sendTelegramMessage(shopBotToken, chatId, reply);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
