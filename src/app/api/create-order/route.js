import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Backend ke liye sirf RAZORPAY_KEY_ID aur RAZORPAY_KEY_SECRET chahiye
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, plan, email, leadId } = await request.json();

    if (!amount || !plan || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Razorpay Order Create Karo
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        plan: plan,
        email: email,
        leadId: leadId
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('❌ Razorpay Order Creation Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create order' 
    }, { status: 500 });
  }
}
