import { NextResponse } from 'next/server';
import postgres from 'postgres';

// Direct PostgreSQL connection (Bypasses all Supabase RLS issues)
const sql = postgres(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email, paymentId, plan } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    console.log('⬆️ Direct DB Upgrade: Updating user:', email, 'to plan:', plan || 'pro');

    // 🔥 DIRECT SQL UPDATE QUERY (No RLS, 100% Admin Access)
    const result = await sql`
      UPDATE leads 
      SET subscription_status = 'active', 
          subscription_plan = ${plan || 'pro'}
      WHERE email = ${email}
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 });
    }

    console.log('✅ User upgraded successfully in DB:', result[0]);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription upgraded to Active successfully!',
      data: result[0]
    });

  } catch (error) {
    console.error('❌ Direct DB Upgrade Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
