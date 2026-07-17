import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name;
    const shopName = body.shopName;
    const phone = body.phone;
    const email = body.email;
    const plan = body.plan || 'pro';
    
    // Validation
    if (!name || !shopName || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

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
          password: body.password,
          subscription_plan: plan,
          subscription_status: 'trial',
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

    // Admin ko notification bhejo (Telegram pe)
    const adminChatId = process.env.ADMIN_CHAT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    const planNames = {
      starter: 'Starter (₹499/mo)',
      pro: 'Pro (₹999/mo)',
      premium: 'Premium (₹1999/mo)'
    };
    
    if (adminChatId && botToken) {
      const message = `🎉 NEW LEAD!\n\n👤 Name: ${name}\n🏪 Shop: ${shopName}\n📞 Phone: ${phone}\n📧 Email: ${email}\n💰 Plan: ${planNames[plan] || plan}\n\n📅 Trial Start: ${trialStartDate.toLocaleString('en-IN')}\n📅 Trial End: ${trialEndDate.toLocaleDateString('en-IN')}\n\n🎁 First month 50% OFF will auto-apply!\n\nStatus: New Lead`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: message
        })
      });
    }

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
