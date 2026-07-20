import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: 'Token and new password are required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. Check karo ki token valid hai aur expire nahi hua
    const { data: user, error: fetchError } = await supabase
      .from('leads')
      .select('email')
      .eq('reset_token', token)
      .gt('reset_token_expires', now) // Expiry time future mein hona chahiye
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
    }

    // 2. Password Update Karo aur Token Clear Kar Do (Taaki link sirf 1 baar kaam kare)
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        password: newPassword,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('email', user.email);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Update Password Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
