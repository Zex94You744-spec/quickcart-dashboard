import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });

    // Pehle us user ke saare orders delete karo (taaki database clean rahe)
    await sql`DELETE FROM orders WHERE shop_owner_email = ${email}`;
    
    // Phir user ko leads table se delete karo
    const result = await sql`DELETE FROM leads WHERE email = ${email} RETURNING email`;

    if (result.length > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
