import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { botToken } = await request.json();

    if (!botToken) {
      return NextResponse.json({ success: false, error: 'Bot token is required' }, { status: 400 });
    }

    // Webhook URL (Tera Vercel URL + /api/telegram + token parameter)
    const webhookUrl = `https://quickcart-dashboard-ten.vercel.app/api/telegram?token=${botToken}`;

    // Telegram API ko webhook set karne ke liye call karo
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message']
      })
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook set successfully',
        webhookUrl: webhookUrl
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.description || 'Failed to set webhook' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook setup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
