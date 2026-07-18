import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  console.log('🔔 Telegram webhook hit!');
  
  try {
    const body = await request.json();
    
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const messageText = body.message.text;
      const firstName = body.message.from.first_name || 'Unknown';

      // Smart Extraction: Items, Address, Phone, Amount
      const amountMatch = messageText.match(/(?:total|Total|₹)\s*:?\s*(\d+)/i);
      const extractedAmount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

      const phoneMatch = messageText.match(/(\d{10})/);
      const extractedPhone = phoneMatch ? phoneMatch[1] : '';

      // Address extract karo (Mumbai, Kardha, etc.)
      const addressMatch = messageText.match(/(?:Mumbai|Kardha|Delhi|Bangalore|Chennai|Kolkata)/i);
      const extractedAddress = addressMatch ? addressMatch[0] : 'Not provided';

      // Items extract karo (Order: ke baad ka text)
      const itemsMatch = messageText.match(/Order:\s*(.+?)(?:,|$)/i);
      const extractedItems = itemsMatch ? itemsMatch[1].trim() : messageText;

      // Unique tracking code generate karo
      const trackingCode = 'TRACK' + Date.now().toString().slice(-6);

      // Order save karo
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: firstName,
            customer_chat_id: chatId,
            items: extractedItems,
            amount: extractedAmount,
            address: extractedAddress,
            phone: extractedPhone,
            tracking_code: trackingCode,
            status: 'Pending'
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      console.log('✅ Order saved:', data);

      // Customer ko reply bhejo with tracking link
      if (BOT_TOKEN && data && data[0]) {
        const trackingLink = `https://quickcart-dashboard-ten.vercel.app/track/${data[0].id}`;
        
        const replyMessage = `✅ *Order Received!*\n\n📦 *Items:*\n• ${extractedItems}\n\n💰 *Total: ₹${extractedAmount}*\n📍 *Address: ${extractedAddress}*\n📞 *Phone: ${extractedPhone}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Order saved! Shop will contact you soon.`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyMessage,
            parse_mode: 'Markdown'
          })
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Telegram Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
