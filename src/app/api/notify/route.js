import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { orderId, newStatus } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing');
      return NextResponse.json({ success: false, error: 'Supabase config missing' }, { status: 500 });
    }
    
    if (!botToken) {
      console.error('Telegram Bot Token missing');
      return NextResponse.json({ success: false, error: 'Bot token missing' }, { status: 500 });
    }
    
    // Supabase client banao
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Order details fetch karo
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !orders) {
      console.error('Order not found:', orderError);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    
    const order = orders;
    const chatId = order.chat_id;
    
    if (!chatId) {
      console.error('Chat ID not found in order');
      return NextResponse.json({ success: false, error: 'Chat ID missing' }, { status: 400 });
    }
    
    // Status message banao
    let statusMessage = '';
    if (newStatus === 'accepted') {
      statusMessage = `✅ *Order Accepted!*\n\nYour order has been accepted by the shop.\n\n*Order ID:* ${orderId}\n\nWe will notify you when it's out for delivery.`;
    } else if (newStatus === 'delivered') {
      statusMessage = `🎉 *Order Delivered!*\n\n✅ Your order has been successfully delivered.\n\nThank you for shopping with QuickCart! 🙏\n\nRate your experience: /start`;
    }
    
    // Telegram pe message bhejo
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: statusMessage,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await telegramResponse.json();
    
    if (result.ok) {
      console.log('Notification sent successfully');
      return NextResponse.json({ success: true });
    } else {
      console.error('Telegram Error:', result);
      return NextResponse.json({ success: false, error: result.description }, { status: 400 });
    }
  } catch (error) {
    console.error('Notification Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
