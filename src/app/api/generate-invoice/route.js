import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const GLOBAL_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { orderId, chatId, botToken: providedBotToken } = await request.json();

    // 1. Fetch Order Details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Fetch Shop Owner Data (Plan check aur Bot Token ke liye)
    const { data: shopData, error: shopError } = await supabase
      .from('leads')
      .select('subscription_plan, bot_token')
      .eq('email', order.shop_owner_email)
      .single();

    if (shopError || !shopData) {
      return NextResponse.json({ success: false, error: 'Shop data not found' }, { status: 404 });
    }

    // 3. ✅ PLAN CHECK: Starter plan mein PDF mat bhejo
    const isProOrPremium = shopData.subscription_plan === 'pro' || shopData.subscription_plan === 'premium';

    if (!isProOrPremium) {
      console.log('📄 Starter plan detected - PDF invoice skipped');
      return NextResponse.json({
        success: false,
        error: 'PDF invoices are available in Pro plan only. Please upgrade.'
      });
    }

    // 4. Use Shop's Bot Token (Fallback to provided or global if needed)
    const finalBotToken = shopData.bot_token || providedBotToken || GLOBAL_BOT_TOKEN;

    // 5. Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header (Blue)
    page.drawRectangle({ x: 0, y: height - 100, width: width, height: 100, color: rgb(0.23, 0.51, 0.96) });
    page.drawText('INVOICE', { x: width / 2 - 60, y: height - 60, size: 32, font: boldFont, color: rgb(1, 1, 1) });

    // Shop Info
    page.drawText('QuickCart Store', { x: 50, y: height - 140, size: 16, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Order ID: #' + String(order.id).slice(0, 8).toUpperCase(), { x: 50, y: height - 165, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Date: ' + new Date(order.created_at).toLocaleDateString('en-IN'), { x: 50, y: height - 185, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    // Customer Info
    page.drawText('Bill To:', { x: 50, y: height - 220, size: 13, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText(String(order.customer_name || 'Customer'), { x: 50, y: height - 240, size: 11, font: font, color: rgb(0.12, 0.16, 0.24) });
    if (order.phone) page.drawText('Phone: ' + String(order.phone), { x: 50, y: height - 260, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    if (order.address) page.drawText('Address: ' + String(order.address), { x: 50, y: height - 280, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    // Table Header
    const tableY = height - 330;
    page.drawRectangle({ x: 50, y: tableY, width: 495, height: 30, color: rgb(0.23, 0.51, 0.96) });
    page.drawText('#', { x: 60, y: tableY + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Item', { x: 100, y: tableY + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Price', { x: 320, y: tableY + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('GST%', { x: 400, y: tableY + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Total', { x: 470, y: tableY + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });

    // Parse Items
    let itemsArray = [];
    if (order.items) {
      const rawItems = String(order.items).split(',').map(i => i.trim()).filter(i => i.length > 0);
      const subtotal = Number(order.amount) || 0;
      const pricePerItem = rawItems.length > 0 ? Math.round(subtotal / rawItems.length) : subtotal;

      itemsArray = rawItems.map(name => ({
        name: name,
        price: pricePerItem,
        gst_rate: 18
      }));
    } else {
      itemsArray = [{ name: 'Order Items', price: Number(order.amount) || 0, gst_rate: 18 }];
    }

    // Draw Items
    let currentY = tableY - 30;
    let calcSubtotal = 0;
    let calcGST = 0;

    itemsArray.forEach((item, idx) => {
      const price = item.price;
      const gst = Math.round(price * item.gst_rate / 100);
      const itemTotal = price + gst;
      calcSubtotal += price;
      calcGST += gst;

      if (idx % 2 === 0) {
        page.drawRectangle({ x: 50, y: currentY - 5, width: 495, height: 25, color: rgb(0.95, 0.96, 0.97) });
      }

      page.drawText(String(idx + 1), { x: 60, y: currentY, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText(item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name, { x: 100, y: currentY, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText('Rs.' + price, { x: 320, y: currentY, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText(item.gst_rate + '%', { x: 400, y: currentY, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText('Rs.' + itemTotal, { x: 470, y: currentY, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });

      currentY -= 30;
    });

    // Totals
    currentY -= 15;
    page.drawLine({ start: { x: 50, y: currentY }, end: { x: 545, y: currentY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    currentY -= 25;
    page.drawText('Subtotal:', { x: 350, y: currentY, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Rs.' + calcSubtotal, { x: 470, y: currentY, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    currentY -= 20;
    page.drawText('GST Amount (18%):', { x: 350, y: currentY, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Rs.' + calcGST, { x: 470, y: currentY, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    currentY -= 25;
    page.drawText('Grand Total:', { x: 350, y: currentY, size: 14, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Rs.' + (calcSubtotal + calcGST), { x: 470, y: currentY, size: 14, font: boldFont, color: rgb(0.06, 0.72, 0.51) });

    // Footer
    page.drawText('Thank you for shopping with us!', { x: width / 2 - 100, y: 60, size: 10, font: font, color: rgb(0.42, 0.45, 0.5) });
    page.drawText('QuickCart - Digitizing Your Business', { x: width / 2 - 110, y: 40, size: 10, font: boldFont, color: rgb(0.12, 0.16, 0.24) });

    // 6. Save and Send PDF via Shop's Bot
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    if (finalBotToken && chatId) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', blob, `Invoice_${String(order.id).slice(0, 8).toUpperCase()}.pdf`);
      formData.append('caption', `🧾 Invoice for Order #${String(order.id).slice(0, 8).toUpperCase()}\n\n*Grand Total: Rs.${calcSubtotal + calcGST}*`);
      formData.append('parse_mode', 'Markdown');

      await fetch(`https://api.telegram.org/bot${finalBotToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PDF Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
