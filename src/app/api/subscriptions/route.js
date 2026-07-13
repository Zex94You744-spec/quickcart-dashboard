import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Pricing constants
const PRICING = {
  starter: { regular: 499, discounted: 249 },
  pro: { regular: 999, discounted: 499 },
  premium: { regular: 1999, discounted: 999 }
};

export async function POST(request) {
  try {
    const { action, leadId } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (action === 'check_and_update') {
      // Saari leads check karo
      const { data: leads } = await supabase.from('leads').select('*');
      
      const now = new Date();
      let updated = 0;

      for (const lead of leads) {
        const trialEnd = new Date(lead.trial_end_date);
        const discountEnd = lead.discount_end_date ? new Date(lead.discount_end_date) : null;

        // Trial se Discounted mein convert karo
        if (lead.subscription_status === 'trial' && now >= trialEnd && !lead.discount_applied) {
          const discountStart = now;
          const discountEnd = new Date(now);
          discountEnd.setMonth(discountEnd.getMonth() + 1); // 1 month discount

          await supabase.from('leads').update({
            subscription_status: 'discounted',
            discount_applied: true,
            discount_start_date: discountStart.toISOString(),
            discount_end_date: discountEnd.toISOString()
          }).eq('id', lead.id);

          // Customer ko notification bhejo
          if (botToken && lead.phone) {
            const plan = lead.subscription_plan || 'pro';
            const price = PRICING[plan].discounted;
            const message = `🎉 *Congratulations ${lead.name}!*\n\nAapka 7-day free trial complete ho gaya hai!\n\n🎁 *Special Offer Activated:*\nAapko pehle mahine ke liye *50% DISCOUNT* mila hai!\n\n💰 Plan: ${plan.toUpperCase()}\n💸 Price: ~~Rs.${PRICING[plan].regular}~~ *Rs.${price}*\n📅 Valid till: ${discountEnd.toLocaleDateString('en-IN')}\n\nPayment ke liye hum aapse jaldi contact karenge.`;
                        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: lead.phone, text: message, parse_mode: 'Markdown' })
            }).catch(e => console.error('Customer notification failed:', e));
          }

          // Admin ko notification
          if (botToken && adminChatId) {
            const adminMsg = `🔄 TRIAL CONVERTED TO DISCOUNT\n\n👤 ${lead.name}\n🏪 ${lead.shop_name}\n📞 ${lead.phone}\n💰 Plan: ${lead.subscription_plan}\n💸 Discounted Price: Rs.${PRICING[lead.subscription_plan || 'pro'].discounted}\n📅 Discount till: ${discountEnd.toLocaleDateString('en-IN')}`;
            
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: adminChatId, text: adminMsg })
            }).catch(e => console.error('Admin notification failed:', e));
          }

          updated++;
        }

        // Discounted se Regular mein convert karo
        if (lead.subscription_status === 'discounted' && discountEnd && now >= discountEnd) {
          await supabase.from('leads').update({
            subscription_status: 'active',
            regular_price_start_date: now.toISOString()
          }).eq('id', lead.id);

          // Customer ko notification
          if (botToken && lead.phone) {
            const plan = lead.subscription_plan || 'pro';
            const price = PRICING[plan].regular;
            const message = `📢 *Dear ${lead.name}*\n\nAapka 50% discount period complete ho gaya hai.\n\nAb se aapka subscription regular price pe continue hoga:\n\n💰 Plan: ${plan.toUpperCase()}\n💸 Price: Rs.${price}/month\n\nKoi bhi query ho toh humse contact karein.\n\nThank you for being with QuickCart! 🙏`;
            
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: lead.phone, text: message, parse_mode: 'Markdown' })
            }).catch(e => console.error('Customer notification failed:', e));
          }

          updated++;
        }
      }

      return NextResponse.json({ success: true, updated });
    }

    if (action === 'select_plan' && leadId) {
      const { plan } = await request.json();      
      await supabase.from('leads').update({
        subscription_plan: plan
      }).eq('id', leadId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscription Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: leads } = await supabase.from('leads').select('*');
    
    const now = new Date();
    const stats = {
      total: leads.length,
      trial: leads.filter(l => l.subscription_status === 'trial').length,
      discounted: leads.filter(l => l.subscription_status === 'discounted').length,
      active: leads.filter(l => l.subscription_status === 'active').length,
      expired: leads.filter(l => l.subscription_status === 'expired').length,
      monthlyRevenue: leads.reduce((sum, l) => {
        if (l.subscription_status === 'discounted') {
          return sum + (PRICING[l.subscription_plan || 'pro'].discounted);
        } else if (l.subscription_status === 'active') {
          return sum + (PRICING[l.subscription_plan || 'pro'].regular);
        }
        return sum;
      }, 0)
    };

    return NextResponse.json({ success: true, stats, leads });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
