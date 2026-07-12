import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { orderId, newStatus } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not found');
      return NextResponse.json({ success: false, error: 'Bot token missing' }, { status: 500 });
    }
    
    // Order details fetch karo
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const orders = await orderResponse.json();
    if (!orders || orders.length === 0) {
      console.error('Order not found');
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    
    const order = orders[0];
    const chatId = order.chat_id;
    
    if (!chatId) {
      console.error('Chat ID not found in order');
      return NextResponse.json({ success: false, error: 'Chat ID missing' }, { status: 400 });
    }
    
    // Status message banao
    let statusMessage = '';
    if (newStatus === 'accepted') {
      statusMessage = `✅ **Order Accepted!**\n\nYour order has been accepted by the shop.\n\nOrder ID: ${orderId}\n\nWe will notify you when it's out for delivery.`;
    } else if (newStatus === 'delivered') {
      statusMessage = `🎉 **Order Delivered!**\n\n✅ Your order has been successfully delivered.\n\nThank you for shopping with QuickCart! 🙏`;
    } else {
      statusMessage = `📦 **Order Update**\n\nYour order status has been updated to: ${newStatus}\n\nOrder ID: ${orderId}`;
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
