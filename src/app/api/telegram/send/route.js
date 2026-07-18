import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { chatId, message } = await request.json();

    if (!BOT_TOKEN) {
      console.error('❌ BOT_TOKEN missing!');
      return NextResponse.json({ success: false, error: 'Bot token not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    const data = await response.json();
    console.log('📤 Telegram message sent:', data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Send message error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
