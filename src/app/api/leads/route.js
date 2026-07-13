import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { name, shopName, phone, email } = await request.json();
    
    // Validation
    if (!name || !shopName || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate trial dates (7 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Save to database
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          shop_name: shopName,
          phone,
          email,
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          status: 'new'
        }
      ])
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    const { name, shopName, phone, email, plan } = await request.json();

    // ... validation ...

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          shop_name: shopName,
          phone,
          email,
          subscription_plan: plan || 'pro',
          subscription_status: 'trial',
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          status: 'new'
        }
      ])
      .select();

    // Admin ko notification bhejo (Telegram pe)
    const adminChatId = process.env.ADMIN_CHAT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (adminChatId && botToken) {
      const message = `🎉 NEW LEAD!\n\n👤 Name: ${name}\n🏪 Shop: ${shopName}\n📞 Phone: ${phone}\n📧 Email: ${email}\n\n📅 Trial Start: ${trialStartDate.toLocaleString('en-IN')}\n📅 Trial End: ${trialEndDate.toLocaleString('en-IN')}\n\nStatus: New Lead`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message
        })
      });
    }

    // User ko confirmation email/WhatsApp (optional - baad mein add karenge)

    return NextResponse.json({ 
      success: true, 
      message: 'Lead saved successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
