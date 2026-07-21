import { NextResponse } from 'next/server';
import postgres from 'postgres';
import crypto from 'crypto';

// Direct PostgreSQL connection (RLS bypass, 100% secure)
const sql = postgres(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userEmail, targetEmail } = await request.json();

    // 1. Security Check: Kya request karne wala Admin hai?
    if (userEmail !== 'devbusines01@gmail.com' && userEmail !== 'support@quickcart.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (!targetEmail) {
      return NextResponse.json({ success: false, error: 'Target email is required' }, { status: 400 });
    }

    // 2. Secure Token Generate Karo
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Expiry Time Set Karo (5 Minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 4. Database Mein Update Karo
    const result = await sql`
      UPDATE leads 
      SET reset_token = ${resetToken}, 
          reset_token_expires = ${expiresAt.toISOString()}
      WHERE email = ${targetEmail}
      RETURNING email;
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 5. Reset Link Banao
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickcart-dashboard-ten.vercel.app';
    const resetLink = `${appUrl}/update-password?token=${resetToken}`;

    console.log('🔑 Admin generated reset link for:', targetEmail);

    return NextResponse.json({ 
      success: true, 
      resetLink: resetLink,
      message: 'Link generated successfully. Valid for 5 minutes.'
    });

  } catch (error) {
    console.error('Admin Reset API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
