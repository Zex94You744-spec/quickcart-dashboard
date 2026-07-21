import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { email } = await request.json();
    console.log('📩 Reset request received for:', email);

    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });

    // 1. Check karo user database mein hai ya nahi
    const { data: user, error: fetchError } = await supabase
      .from('leads')
      .select('email, name')
      .eq('email', email.trim())
      .single();

    // Security: Agar user nahi mila, toh bhi success dikhao (taaki hackers ko pata na chale)
    if (fetchError || !user) {
      console.log('⚠️ User not found in DB, returning fake success for security.');
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // 2. Token Generate Karo
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 3. Database Update Karo
    const { error: updateError } = await supabase
      .from('leads')
      .update({ reset_token: resetToken, reset_token_expires: expiresAt.toISOString() })
      .eq('email', email.trim());

    if (updateError) {
      console.error('❌ DB Update Error:', updateError);
      throw updateError;
    }

    // 4. Link Banao
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app'}/update-password?token=${resetToken}`;

    // 5. EMAIL SEND KARO (FIXED FROM ADDRESS)
    console.log('📧 Attempting to send email to:', email.trim());
    
    const { data, error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev', // ✅ FIX: Sirf email rakho, naam mat rakho
      to: email.trim(),
      subject: 'QuickCart - Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hello <strong>${user.name || 'User'}</strong>,</p>
          <p>You requested a password reset. Click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link expires in 15 minutes.</p>
        </div>
      `
    });

    // ✅ FIX: Ab agar email fail hua, toh hum ERROR return karenge, silent fail nahi!
    if (emailError) {
      console.error('❌ Resend API Error:', emailError);
      return NextResponse.json({ success: false, error: emailError.message }, { status: 500 });
    }

    console.log('✅ Email sent successfully! ID:', data.id);
    return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

  } catch (error) {
    console.error('❌ Critical Reset Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
