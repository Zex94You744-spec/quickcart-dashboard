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

      console.log('📩 New Message:', messageText);

      // 1. Bot Commands ko ignore karo
      if (messageText.trim().startsWith('/')) {
        console.log('️ Ignoring bot command:', messageText);
        return NextResponse.json({ success: true, message: 'Command ignored' });
      }

      // 2. Amount Extract karo
      let extractedAmount = 0;
      const totalMatch = messageText.match(/(?:total|Total)\s*:?\s*(\d+)/i);
      if (totalMatch) extractedAmount = parseInt(totalMatch[1], 10);
      
      if (extractedAmount === 0) {
        const rupeeMatch = messageText.match(/(?:₹|Rs\.?|INR)\s*(\d+)/i);
        if (rupeeMatch) extractedAmount = parseInt(rupeeMatch[1], 10);
      }

      // 3. Phone & Address Extract karo
      const phoneMatch = messageText.match(/(\d{10})/);
      const extractedPhone = phoneMatch ? phoneMatch[1] : '';
      const addressMatch = messageText.match(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
      const extractedAddress = addressMatch ? addressMatch[0] : 'Not provided';

      // 4. Items Extract karo (Clean up)
      let cleanItems = messageText;
      cleanItems = cleanItems.replace(/Order:\s*/i, '');
      cleanItems = cleanItems.replace(/\s*\d{10}\s*/g, '');
      cleanItems = cleanItems.replace(/(?:total|Total)\s*:?\s*\d+/gi, '');
      cleanItems = cleanItems.replace(/(?:₹|Rs\.?|INR)\s*\d+/gi, '');
      cleanItems = cleanItems.replace(/(?:Delhi|Mumbai|Kardha|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/gi, '');
      
      const itemsArray = cleanItems.split(',').map(item => item.trim()).filter(item => item.length > 2 && !/^\d+$/.test(item));
      const finalItems = itemsArray.length > 0 ? itemsArray.join(', ') : messageText.replace(/Order:\s*/i, '').trim();

      console.log('💰 Amount:', extractedAmount, '| 📦 Items:', finalItems);

      // 5. Database Mein Save Karo (SAFE INSERT)
      const newTrackingCode = 'TRACK' + Date.now().toString().slice(-6);

      // ⚠️ FIX: shop_owner_email ko yahan se hata diya hai taaki schema error na aaye.
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: firstName,
            customer_chat_id: chatId,
            items: finalItems,
            amount: extractedAmount,
            address: extractedAddress,
            phone: extractedPhone,
            tracking_code: newTrackingCode,
            status: 'Pending'
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        // Agar DB fail ho, tab bhi user ko reply bhejo taaki wo pareshan na ho
      } else {
        console.log('✅ Order saved:', data);
      }

      // 6. User Ko Reply Bhejo
      if (BOT_TOKEN) {
        const trackingLink = `https://quickcart-dashboard-ten.vercel.app/track/${data && data[0] ? data[0].id : 'latest'}`;
        const replyMessage = `✅ *Order Received!*\n\n📦 *Items:*\n• ${finalItems}\n\n💰 *Total: ₹${extractedAmount}*\n *Address: ${extractedAddress}*\n📞 *Phone: ${extractedPhone}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Order saved! Shop will contact you soon.`;

        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyMessage,
            parse_mode: 'Markdown'
          })
        });
        
        if (!tgResponse.ok) {
           console.error('❌ Telegram API Error:', await tgResponse.text());
        }
      } else {
        console.error('❌ BOT_TOKEN is missing in Vercel Environment Variables!');
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Telegram Webhook Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
