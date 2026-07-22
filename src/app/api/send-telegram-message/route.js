import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { botToken, chatId, message } = await request.json();

    if (!botToken || !chatId || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description || 'Failed to send message' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Send telegram message error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
