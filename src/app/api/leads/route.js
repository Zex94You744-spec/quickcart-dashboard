import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, shopName, phone, email, password, plan } = body;

    // 1. CHECK: Kya ye email pehle se registered hai?
    const { data: existingUser } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ye email pehle se registered hai. Please login karein.' }, 
        { status: 400 }
      );
    }

    // 2. Calculate trial dates (7 days from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // 3. Naya user insert karo
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          shop_name: shopName,
          phone,
          email,
          password: password || 'default123',
          subscription_plan: plan || 'pro',
          subscription_status: 'trial',
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          status: 'new'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Leads API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
