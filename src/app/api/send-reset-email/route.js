import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // 1. Check karo ki user database mein hai ya nahi
    const { data: user } = await supabase
      .from('leads')
      .select('email, name')
      .eq('email', email.trim())
      .single();

    // Security: Agar user nahi bhi hai, tab bhi success return karo (taaki hackers ko pata na chale)
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, instructions sent.' });
    }

    // 2. Ek Random Temporary Password Generate Karo (8 characters)
    const tempPassword = Math.random().toString(36).slice(-8);

    // 3. Database Mein Password Update Karo
    const { error: updateError } = await supabase
      .from('leads')
      .update({ password: tempPassword })
      .eq('email', email.trim());

    if (updateError) {
      console.error('DB Update Error:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    }

    // 4. Resend Se Email Bhejo
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'QuickCart Support <onboarding@resend.dev>', // Baad mein apna custom domain laga sakte ho
      to: email.trim(),
      subject: 'QuickCart - Password Reset Instructions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2563eb;">QuickCart Password Reset</h2>
          <p>Hello <strong>${user.name || 'User'}</strong>,</p>
          <p>We received a request to reset your password. Your new temporary password is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1f2937; margin: 20px 0;">
            ${tempPassword}
          </div>
          <p>Please log in to your dashboard and change this password immediately for security reasons.</p>
          <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">© 2026 QuickCart. All rights reserved.</p>
        </div>
      `
    });

    if (emailError) {
      console.error('Resend Error:', emailError);
      // Even if email fails, we return success to prevent email enumeration
    }

    return NextResponse.json({ success: true, message: 'If an account exists, instructions sent.' });

  } catch (error) {
    console.error('Reset API Critical Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
