import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { orderIds } = await request.json();
    
    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No orders selected' }, { status: 400 });
    }

    // Pehle check karo ki sab orders Delivered ya Rejected hain
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status')
      .in('id', orderIds);

    const canDeleteIds = orders
      .filter(order => order.status === 'Delivered' || order.status === 'Rejected')
      .map(order => order.id);

    const cannotDeleteCount = orderIds.length - canDeleteIds.length;

    if (cannotDeleteCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `${cannotDeleteCount} order(s) cannot be deleted. Only Delivered or Rejected orders can be deleted.` 
      }, { status: 400 });
    }

    // Delete karo
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: orderIds.length });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
