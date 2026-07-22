import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { botToken } = await request.json();

    if (!botToken) {
      return NextResponse.json({ success: false, error: 'Bot token is required' }, { status: 400 });
    }

    // Telegram API se bot info fetch karo
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        botName: result.result.first_name,
        botUsername: result.result.username
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description || 'Invalid bot token' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
