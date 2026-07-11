import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { chatId, pdf, filename } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(pdf, 'base64');
    
    // Telegram ko PDF bhejo
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('chat_id', chatId);
    formData.append('document', blob, filename);
    formData.append('caption', ' *Thank you for your order!*\n\nHere is your invoice. Please keep it for your records.\n\nThanks for shopping with us! 🙏');
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: result.description }, { status: 400 });
    }
  } catch (error) {
    console.error('Send Invoice Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
