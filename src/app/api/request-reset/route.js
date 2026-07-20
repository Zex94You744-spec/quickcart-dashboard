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
    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });

    const { data: user } = await supabase.from('leads').select('email, name').eq('email', email.trim()).single();

    // Security: Agar user nahi bhi hai, tab bhi success return karo
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // 1. Secure Random Token Generate Karo (64 characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 2. Expiry Time Set Karo (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 3. Database Mein Save Karo
    const { error: updateError } = await supabase
      .from('leads')
      .update({ reset_token: resetToken, reset_token_expires: expiresAt.toISOString() })
      .eq('email', email.trim());

    if (updateError) throw updateError;

    // 4. Reset Link Banao
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${resetToken}`;

    // 5. Resend Se Email Bhejo
    await resend.emails.send({
      from: 'QuickCart Support <onboarding@resend.dev>',
      to: email.trim(),
      subject: 'QuickCart - Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hello <strong>${user.name || 'User'}</strong>,</p>
          <p>You requested a password reset for your QuickCart account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 15 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

  } catch (error) {
    console.error('Reset Request Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
