import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTranslation } from '../../../lib/translations';

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
    let shopLanguage = 'hindi'; // Default language

    // 1. Fetch Shop Owner & Language
    if (incomingBotToken) {
      const { data: shopOwner } = await supabase
        .from('leads')
        .select('email, bot_token, preferred_language')
        .eq('bot_token', incomingBotToken)
        .single();
      
      if (shopOwner) {
        targetShopEmail = shopOwner.email;
        shopBotToken = shopOwner.bot_token || incomingBotToken;
        shopLanguage = shopOwner.preferred_language || 'hindi';
      }
    }

    // Load Translations
    const t = getTranslation(shopLanguage);

    // 2. HANDLE /MENU OR /PRICE COMMAND
    if (lowerText === '/menu' || lowerText === '/price' || lowerText === 'menu') {
      if (!targetShopEmail) {
        await sendTelegramMessage(shopBotToken, chatId, t.shopNotFound);
        return NextResponse.json({ success: true });
      }

      const { data: products } = await supabase
        .from('products')
        .select('name, unit, price')
        .eq('shop_owner_email', targetShopEmail)
        .order('created_at', { ascending: true });

      if (products && products.length > 0) {
        let menuText = `${t.menuTitle}\n\n`;
        products.forEach(p => {
          menuText += `• ${p.name} (${p.unit}): ₹${p.price}\n`;
        });
        menuText += `\n${t.howToOrder}\n${t.orderFormat}`;
        await sendTelegramMessage(shopBotToken, chatId, menuText);
      } else {
        await sendTelegramMessage(shopBotToken, chatId, t.priceListEmpty);
      }
      return NextResponse.json({ success: true });
    }

    // 3. OTHER COMMANDS
    if (lowerText.startsWith('/')) {
      await sendTelegramMessage(shopBotToken, chatId, `${t.welcomeMessage}\n${t.orderFormat}`);
      return NextResponse.json({ success: true });
    }

    // 4. ORDER DETECTION
    const isLikelyOrder = lowerText.includes('order:') || /\d{10}/.test(text);

    if (!isLikelyOrder) {
      await sendTelegramMessage(shopBotToken, chatId, `${t.sendMenuToSeePrices}\n*${t.orderFormatMessage}*`);
      return NextResponse.json({ success: true });
    }

    // 5. EXTRACT DATA
    const phoneMatch = text.match(/(\d{10})/);
    const phone = phoneMatch ? phoneMatch[1] : '';
    const cityMatch = text.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
    const address = cityMatch ? cityMatch[0] : 'Not provided';

    let cleanItems = text.replace(/Order:\s*/i, '')
      .replace(/(?:total|Total|amount|Amount)\s*:?\s*\d+/gi, '')
      .replace(/,\s*\d{10}/, '')
      .replace(/,\s*(Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/gi, '')
      .replace(/,\s*$/, '').trim();

    let itemsArray = cleanItems.split(',').map(i => i.trim()).filter(i => i.length > 0);

    // ✅ 6. AUTO CALCULATE TOTAL (Unicode Friendly)
    let calculatedTotal = 0;
    let replyItems = "";

    const { data: products } = await supabase
      .from('products')
      .select('name, price')
      .eq('shop_owner_email', targetShopEmail);

    if (products && products.length > 0) {
      for (let item of itemsArray) {
        // ✅ UPDATED REGEX: Ab ye Odia, Hindi, aur kisi bhi bhasha ke characters ko pakad lega
        const match = item.match(/(\d+)\s*(kg|g|l|ml)?\s*(.+)/i);
        
        if (match) {
          const qty = parseInt(match[1]);
          const unit = match[2] || 'kg';
          const itemName = match[3].toLowerCase().trim(); // Odia/Hindi text yahan aayega
          
          // ✅ SMART MATCHING: Database ke name mein item ho, ya item mein database ka name ho
          const product = products.find(p => 
            p.name.toLowerCase().includes(itemName) || 
            itemName.includes(p.name.toLowerCase())
          );
          
          if (product) {
            const itemTotal = qty * product.price;
            calculatedTotal += itemTotal;
            replyItems += `• ${qty}${unit} ${product.name} (₹${itemTotal})\n`;
          } else {
            replyItems += `• ${item} (Price TBD)\n`;
          }
        } else {
          // Agar format match nahi hua, toh use as-is chhod do
          replyItems += `• ${item}\n`;
        }
      }
    } else {
      replyItems = itemsArray.map(i => `• ${i}`).join('\n');
      const totalMatch = text.match(/(?:total|Total)\s*:?\s*(\d+)/i);
      if (totalMatch) calculatedTotal = parseInt(totalMatch[1], 10);
    }

    // 7. DUPLICATE CHECK
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
      console.log(t.duplicateOrder);
      return NextResponse.json({ success: true, message: 'Duplicate' });
    }

    // 8. SAVE ORDER
    let orderId = null;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_name: firstName,
        customer_chat_id: chatId,
        items: cleanItems,
        amount: calculatedTotal,
        phone: phone,
        address: address,
        status: 'Pending',
        shop_owner_email: targetShopEmail
      })
      .select();

    if (data && data[0]) orderId = data[0].id;

    // 9. REPLY TO CUSTOMER IN THEIR LANGUAGE
    if (orderId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
      const trackLink = `${appUrl}/track/${orderId}`;
      
      const finalMessage = `${t.orderReceived}\n\n${t.items}\n${replyItems}\n${t.calculatedTotal} ₹${calculatedTotal}\n${t.address} ${address}\n${t.phone} ${phone}\n\n${t.track}\n${trackLink}\n\n${t.shopWillConfirmShortly}`;
      
      await sendTelegramMessage(shopBotToken, chatId, finalMessage);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
