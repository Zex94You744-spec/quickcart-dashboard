import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

// Razorpay instance initialize karo (Test Keys abhi ke liye, baad mein Live keys dalna)
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, planName } = await request.json();

    const options = {
      amount: amount * 100, // Razorpay amount ko 'paise' mein leta hai (₹499 = 49900 paise)
      currency: "INR",
      receipt: `receipt_qc_${Date.now()}`,
      notes: {
        plan: planName,
        source: "quickcart_web"
      }
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);

  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
