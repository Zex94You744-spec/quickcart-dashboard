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
    console.log('📦 Full webhook payload:', JSON.stringify(body, null, 2));
    
    // Check karo ki ye valid message hai
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const messageText = body.message.text;
      const firstName = body.message.from.first_name || 'Unknown';
      const userId = body.message.from.id;

      console.log('📩 New Telegram Message:', messageText);
      console.log('👤 From user:', firstName, '(ID:', userId, ')');

      // Smart Amount Extraction: "total: 650" ya "₹650" ko dhund kar number nikalega
      const amountMatch = messageText.match(/(?:total|Total|₹)\s*:?\s*(\d+)/i);
      const extractedAmount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

      // Order ko database mein save karo
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: firstName,
            items: messageText,
            amount: extractedAmount, // 👈 Ab sahi amount save hoga!
            status: 'Pending'
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      console.log('✅ Order saved to database:', data);
      
      // User ko reply bhejo
      if (BOT_TOKEN) {
        const replyResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Dhanyawad ${firstName}!\n\nAapka order receive ho gaya hai:\n"${messageText}"\n\nHum jald hi confirm karenge.`
          })
        });

        const replyData = await replyResponse.json();
        console.log('📤 Telegram reply sent:', replyData);
      } else {
        console.error('❌ BOT_TOKEN missing in environment variables!');
      }

      return NextResponse.json({ success: true });
    } else {
      console.log('⚠️ No valid message in webhook payload');
      return NextResponse.json({ success: true, message: 'No message to process' });
    }
  } catch (error) {
    console.error('❌ Telegram Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
