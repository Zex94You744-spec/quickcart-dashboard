import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PRICING = {
  starter: { regular: 499, discounted: 249 },
  pro: { regular: 999, discounted: 499 },
  premium: { regular: 1999, discounted: 999 }
};

function getPrice(plan, priceType) {
  const planPricing = PRICING[plan] || PRICING.pro;
  return planPricing[priceType];
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request) {
  try {
    const { leadId, plan } = await request.json();
    
    if (!leadId || !plan) {
      return NextResponse.json(
        { success: false, error: 'Lead ID and plan required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const isDiscounted = lead.subscription_status === 'discounted';
    const price = getPrice(plan, isDiscounted ? 'discounted' : 'regular');
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
    
    // Receipt ko short bana (Razorpay max 40 chars allow karta hai)
    const receipt = `qc_${Date.now()}`;
    
    // Razorpay Order Create Kar
    const payment = await razorpay.orders.create({
      amount: price * 100, // Amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        lead_id: lead.id,
        lead_name: lead.name,
        shop_name: lead.shop_name,
        plan: planName,
        subscription_type: isDiscounted ? 'First Month (50% OFF)' : 'Regular'
      }
    });

    const paymentUrl = payment.short_url || `https://razorpay.com/order/${payment.id}`;

    // Telegram Notification Bhejo
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    // Chat ID: Pehle telegram_chat_id check karo, fallback ke liye admin ko bhej do
    const chatId = adminChatId; 
    
    console.log('🔍 Debug Info:');
    console.log('- lead.telegram_chat_id (Phone Number, Invalid):', lead.telegram_chat_id);
    console.log('- adminChatId from env:', adminChatId);
    console.log('- Final chatId being used:', chatId);

    if (botToken && chatId) {
      // ... existing message code ...
    } else {
      console.error('❌ Telegram notification skipped: Missing bot token or chat ID');
      console.error('Bot Token:', botToken ? 'Exists' : 'MISSING');
      console.error('Chat ID:', chatId || 'MISSING');
    }

    if (botToken && chatId) {
      // HTML parse mode use karte hain aur user input ko escape karte hain taaki error na aaye
      const safeName = escapeHtml(lead.name);
      const safeShop = escapeHtml(lead.shop_name);
      const discountText = isDiscounted ? '<b>(50% OFF Applied!)</b>' : '';
      
      const message = `💳 <b>Payment Link - QuickCart</b>

👤 Name: ${safeName}
🏪 Shop: ${safeShop}
💰 Plan: ${planName} ${discountText}
💸 Amount: Rs.${price}

🔗 <a href="${paymentUrl}">Click Here to Pay Securely</a>

⏰ Valid for 24 hours

Thank you for choosing QuickCart!`;

      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });
        
        const telegramResult = await telegramResponse.json();
        
        if (!telegramResult.ok) {
          console.error('Telegram Error Details:', telegramResult);
        }
      } catch (error) {
        console.error('Telegram notification failed:', error);
      }
    } else {
      console.warn('Telegram Bot Token or Chat ID missing. Notification skipped.');
    }

    return NextResponse.json({ 
      success: true, 
      paymentUrl,
      orderId: payment.id,
      amount: price
    });
  } catch (error) {
    console.error('Payment Link Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
