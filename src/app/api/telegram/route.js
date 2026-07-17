import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Yahan apna Telegram Bot Token daal do (BotFather se mila tha)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Check karo ki ye valid message hai
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const messageText = body.message.text;
      const firstName = body.message.from.first_name || 'Unknown';

      console.log('📩 New Telegram Message:', messageText);

      // Simple logic: Agar message mein "Order" ya koi amount ka pattern ho, toh save karo
      // (Real app mein hum AI/Regex se items aur amount extract karenge)
      
      // Demo ke liye, hum assume karte hain ki user ne format mein bheja: "Order: Rice 5kg, Amount: 500"
      // Ya fir hum direct message ko items mein save kar dete hain
      
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: firstName,
            items: messageText, // Abhi ke liye pura message items mein save ho raha hai
            amount: 0, // Baad mein regex se extract karenge, abhi 0
            status: 'Pending'
          }
        ])
        .select();

      if (error) {
        console.error('Database error:', error);
      } else {
        console.log('✅ Order saved to database:', data);
        
        // Bot user ko reply bhi kar sakta hai (Optional)
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Dhanyawad ${firstName}! Aapka order receive ho gaya hai. Hum jald hi confirm karenge.`
          })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
