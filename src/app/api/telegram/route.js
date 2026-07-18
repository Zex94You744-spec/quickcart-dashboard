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

      // --- 1. SMART AMOUNT EXTRACTION ---
      let extractedAmount = 0;
      
      // Try 1: "total: 650" ya "Total: 650"
      const totalMatch = messageText.match(/(?:total|Total)\s*:?\s*(\d+)/i);
      if (totalMatch) {
        extractedAmount = parseInt(totalMatch[1], 10);
      }
      
      // Try 2: "₹650" ya "Rs. 650" ya "Rs 650"
      if (extractedAmount === 0) {
        const rupeeMatch = messageText.match(/(?:₹|Rs\.?|INR)\s*(\d+)/i);
        if (rupeeMatch) {
          extractedAmount = parseInt(rupeeMatch[1], 10);
        }
      }
      
      // Try 3: Fallback (Last valid number, phone number ko ignore karke)
      if (extractedAmount === 0) {
        const numbers = messageText.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          for (let i = numbers.length - 1; i >= 0; i--) {
            const num = parseInt(numbers[i], 10);
            // Phone number 10 digit ka hota hai (1 billion se bada), isliye usko skip karo
            if (num < 1000000000 && num > 0) {
              extractedAmount = num;
              break;
            }          }
        }
      }

      console.log('💰 Extracted Amount:', extractedAmount);

      // --- 2. PHONE & ADDRESS EXTRACTION ---
      const phoneMatch = messageText.match(/(\d{10})/);
      const extractedPhone = phoneMatch ? phoneMatch[1] : '';

      // Common cities add kar sakte ho
      const addressMatch = messageText.match(/(?:Mumbai|Kardha|Delhi|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
      const extractedAddress = addressMatch ? addressMatch[0] : 'Not provided';

      // --- 3. ITEMS EXTRACTION (Clean up the text) ---
      // Amount, phone, aur address ko text se hata do taaki sirf items bachein
      let cleanItems = messageText
        .replace(/\d{10}/g, '') // Phone number hatao
        .replace(/(?:Mumbai|Kardha|Delhi|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/gi, '') // Address hatao
        .replace(/(?:total|Total|₹|Rs\.?|INR)\s*:?\s*\d+/gi, '') // Amount hatao
        .replace(/Order:\s*/i, '') // "Order:" word hatao
        .replace(/^,|,$/g, '') // Shuru aur end ke commas hatao
        .trim();
        
      const extractedItems = cleanItems || messageText;

      // --- 4. SAVE TO DATABASE ---
      const trackingCode = 'TRACK' + Date.now().toString().slice(-6);

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

      // --- 5. SEND REPLY TO CUSTOMER ---
      if (BOT_TOKEN && data && data[0]) {
        const trackingLink = `https://quickcart-dashboard-ten.vercel.app/track/${data[0].id}`;
        
        const replyMessage = `✅ *Order Received!*\n\n *Items:*\n• ${extractedItems}\n\n💰 *Total: ₹${extractedAmount}*\n📍 *Address: ${extractedAddress}*\n📞 *Phone: ${extractedPhone}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n Order saved! Shop will contact you soon.`;

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
