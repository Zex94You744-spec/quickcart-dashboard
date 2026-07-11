import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { orderId, newStatus } = await request.json();
    
    // Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Order details fetch karo
    const { data: order, error } = await supabase
      .from('orders')
      .select('chat_id, items, address, phone, status')
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Telegram Bot Token (Cloudflare secret se lenge)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Customer ko message bhejo
    let message = '';
    
    if (newStatus === 'accepted') {
      message = `✅ **Order Accepted!**\n\n` +
        `📦 Items:\n${Array.isArray(order.items) ? order.items.map(i => `- ${i}`).join('\n') : `- ${order.items}`}\n\n` +
        `📍 Delivery Address: ${order.address}\n` +
        `📞 Phone: ${order.phone}\n\n` +
        `🚚 Your order is being prepared. We'll notify you when it's out for delivery!`;
    } else if (newStatus === 'delivered') {
      message = `🎉 **Order Delivered!**\n\n` +
        `✅ Your order has been successfully delivered.\n\n` +
        `Thank you for shopping with QuickCart! 🙏\n` +
        `Rate your experience: /start`;
    }
    
    // Telegram API call
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: order.chat_id,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    return NextResponse.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
