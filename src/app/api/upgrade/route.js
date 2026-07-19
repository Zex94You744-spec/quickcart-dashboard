import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { email, paymentId, plan } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    console.log('⬆️ Upgrading user:', email, 'to plan:', plan || 'pro');

    // 1. Database mein user ka status update karo
    const { data, error } = await supabase
      .from('leads')
      .update({
        subscription_status: 'active', // ✅ YE LINE SABSE IMPORTANT HAI
        plan: plan || 'pro',
        last_payment_id: paymentId || 'manual_upgrade',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Database Update Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('✅ User upgraded successfully in DB:', data);

    // 2. Success response bhejo
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription upgraded to Active successfully!',
      data: data[0]
    });

  } catch (error) {
    console.error('❌ Upgrade API Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
