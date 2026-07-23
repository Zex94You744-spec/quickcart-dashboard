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
        .select('email, bot_token')
        .eq('bot_token', incomingBotToken)
        .single();
      
      if (shopOwner) {
        targetShopEmail = shopOwner.email;
        shopBotToken = shopOwner.bot_token || incomingBotToken;
      }
    }

    // ✅ 1. HANDLE /MENU OR /PRICE COMMAND
    if (lowerText === '/menu' || lowerText === '/price' || lowerText === 'menu') {
      if (!targetShopEmail) {
        await sendTelegramMessage(shopBotToken, chatId, "⚠️ Shop not found. Please contact support.");
        return NextResponse.json({ success: true });
      }

      const { data: products } = await supabase
        .from('products')
        .select('name, unit, price')
        .eq('shop_owner_email', targetShopEmail)
        .order('created_at', { ascending: true });

      if (products && products.length > 0) {
        let menuText = `🏪 *Our Price List*\n\n`;
        products.forEach(p => {
          menuText += `• ${p.name} (${p.unit}): ₹${p.price}\n`;
        });
        menuText += `\n📝 *How to order:*\nOrder: 2kg pyaaz, 1kg aalu, Delhi, 9876543210`;
        await sendTelegramMessage(shopBotToken, chatId, menuText);
      } else {
        await sendTelegramMessage(shopBotToken, chatId, "📭 Price list is currently empty. Please try again later.");
      }
      return NextResponse.json({ success: true });
    }

    // Commands
    if (lowerText.startsWith('/')) {
      await sendTelegramMessage(shopBotToken, chatId, `*Welcome!* Send /menu to see prices.\n\n*Order format:*\nOrder: 2kg pyaaz, Delhi, 9876543210`);
      return NextResponse.json({ success: true });
    }

    // Order detection
    const isLikelyOrder = lowerText.includes('order:') || /\d{10}/.test(text);

    if (!isLikelyOrder) {
      await sendTelegramMessage(shopBotToken, chatId, `👋 Please send /menu to see prices or send order like:\n*Order: 2kg pyaaz, Delhi, 9876543210*`);
      return NextResponse.json({ success: true });
    }

    // Extract Phone & Address
    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';
    const cityMatch = text.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
    const address = cityMatch ? cityMatch[0] : 'Not provided';

    // ✅ 2. CLEAN ITEMS STRING (Remove "total: XXX", phone, city)
    let cleanItems = text.replace(/Order:\s*/i, '')
      .replace(/(?:total|Total|amount|Amount)\s*:?\s*\d+/gi, '') // Removes "total: 600"
      .replace(/,\s*\d{10}/, '') // Removes phone
      .replace(/,\s*(Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/gi, '') // Removes city
      .replace(/,\s*$/, '').trim(); // Removes trailing comma

    let itemsArray = cleanItems.split(',').map(i => i.trim()).filter(i => i.length > 0);

    // ✅ 3. AUTO CALCULATE TOTAL FROM DATABASE
    let calculatedTotal = 0;
    let replyItems = "";

    const { data: products } = await supabase
      .from('products')
      .select('name, price')
      .eq('shop_owner_email', targetShopEmail);

    if (products && products.length > 0) {
      for (let item of itemsArray) {
        // Extract quantity and name (e.g., "5kg pyaaz" -> qty: 5, name: pyaaz)
        const match = item.match(/(\d+)\s*(kg|g|l|ml)?\s*([a-zA-Z]+)/i);
        if (match) {
          const qty = parseInt(match[1]);
          const unit = match[2] || 'kg';
          const itemName = match[3].toLowerCase();
          
          const product = products.find(p => p.name.toLowerCase().includes(itemName));
          
          if (product) {
            const itemTotal = qty * product.price;
            calculatedTotal += itemTotal;
            replyItems += `• ${qty}${unit} ${product.name} (₹${itemTotal})\n`;
          } else {
            replyItems += `• ${item} (Price TBD)\n`;
          }
        } else {
          replyItems += `• ${item}\n`;
        }
      }
    } else {
      // Fallback if no price list is set
      replyItems = itemsArray.map(i => `• ${i}`).join('\n');
      const totalMatch = text.match(/(?:total|Total)\s*:?\s*(\d+)/i);
      if (totalMatch) calculatedTotal = parseInt(totalMatch[1], 10);
    }

    // DUPLICATE CHECK (Last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_chat_id', chatId)
      .eq('amount', calculatedTotal)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .single();

    if (existingOrder) {
      console.log('⚠️ Duplicate order - ignored');
      return NextResponse.json({ success: true, message: 'Duplicate' });
    }

    // Save order DIRECTLY as Pending with CALCULATED price
    let orderId = null;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name: firstName,
        customer_chat_id: chatId,
        items: cleanItems, // Save clean items in DB
        amount: calculatedTotal, // Save CORRECT calculated price in DB
        phone: phone,
        address: address,
        status: 'Pending',
        shop_owner_email: targetShopEmail
      })
      .select();

    if (data && data[0]) orderId = data[0].id;

    // Reply to customer with CLEAN formatting
    if (orderId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
      const trackLink = `${appUrl}/track/${orderId}`;
      
      await sendTelegramMessage(shopBotToken, chatId, 
        `✅ *Order Received!*\n\n📦 *Items:*\n${replyItems}\n💰 *Calculated Total:* ₹${calculatedTotal}\n📍 *Address:* ${address}\n📞 *Phone:* ${phone}\n\n🔗 *Track:*\n${trackLink}\n\n💾 Shop will confirm shortly.`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
