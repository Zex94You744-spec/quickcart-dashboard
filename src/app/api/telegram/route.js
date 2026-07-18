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
      
      // Try 1: "total: 350" ya "Total: 350"
      const totalMatch = messageText.match(/(?:total|Total)\s*:?\s*(\d+)/i);
      if (totalMatch) {
        extractedAmount = parseInt(totalMatch[1], 10);
      }
      
      // Try 2: "₹350" ya "Rs. 350" ya "Rs 350"
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
            if (num < 1000000000 && num > 0) {
              extractedAmount = num;
              break;
            }
          }        }
      }

      console.log('💰 Extracted Amount:', extractedAmount);

      // --- 2. PHONE & ADDRESS EXTRACTION ---
      const phoneMatch = messageText.match(/(\d{10})/);
      const extractedPhone = phoneMatch ? phoneMatch[1] : '';

      const addressMatch = messageText.match(/(?:Mumbai|Kardha|Delhi|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/i);
      const extractedAddress = addressMatch ? addressMatch[0] : 'Not provided';

      // --- 3. ITEMS EXTRACTION (Ultimate Split & Filter) ---
      let cleanItems = messageText;
      
      // Step 1: "Order:" word hatao
      cleanItems = cleanItems.replace(/Order:\s*/i, '');
      
      // Step 2: Phone number hatao (exactly 10 digits)
      cleanItems = cleanItems.replace(/\s*\d{10}\s*/g, '');
      
      // Step 3: Amount patterns hatao
      cleanItems = cleanItems.replace(/(?:total|Total)\s*:?\s*\d+/gi, '');
      cleanItems = cleanItems.replace(/(?:₹|Rs\.?|INR)\s*\d+/gi, '');
      
      // Step 4: Cities hatao
      cleanItems = cleanItems.replace(/(?:Mumbai|Kardha|Delhi|Bangalore|Chennai|Kolkata|Pune|Hyderabad)/gi, '');
      
      // Step 5: Standalone 3-4 digit numbers hatao (jo amounts hain)
      cleanItems = cleanItems.replace(/,\s*\d{3,4}\s*,/g, ',');
      cleanItems = cleanItems.replace(/,\s*\d{3,4}$/, '');
      
      // Step 6: SPLIT BY COMMA, FILTER, AND JOIN (The Ultimate Fix)
      const itemsArray = cleanItems
        .split(',')                    // Comma se split karo
        .map(item => item.trim())      // Har item ko trim karo
        .filter(item => {
          // Empty strings, pure numbers, aur bohot chhote items ko hatao
          return item.length > 2 && !/^\d+$/.test(item);
        });
      
      // Join with comma (ab koi trailing comma nahi aayega)
      const extractedItems = itemsArray.join(', ');
      
      // Agar items empty hai, toh original use karo
      const finalItems = extractedItems.length > 3 ? extractedItems : messageText.replace(/Order:\s*/i, '').trim();

      console.log('📦 Extracted Items:', finalItems);

      // --- 4. SAVE TO DATABASE ---      const newTrackingCode = 'TRACK' + Date.now().toString().slice(-6);

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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      console.log('✅ Order saved:', data);

      // --- 5. SEND REPLY TO CUSTOMER ---
      if (BOT_TOKEN && data && data[0]) {
        const trackingLink = `https://quickcart-dashboard-ten.vercel.app/track/${data[0].id}`;
        
        // Final safety check for reply message (remove trailing comma if any)
        const cleanReplyItems = finalItems.replace(/,\s*$/, '').trim();

        const replyMessage = `✅ *Order Received!*\n\n📦 *Items:*\n• ${cleanReplyItems}\n\n💰 *Total: ₹${extractedAmount}*\n📍 *Address: ${extractedAddress}*\n📞 *Phone: ${extractedPhone}*\n\n🔗 *Track your order:*\n${trackingLink}\n\n💾 Order saved! Shop will contact you soon.`;

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
  } catch (error) {    console.error('❌ Telegram Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
