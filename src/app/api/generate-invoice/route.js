import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { orderId, chatId } = await request.json();
    console.log('🧾 Generating pdf-lib invoice for order:', orderId);

    // 1. Fetch order from database
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Order not found:', error);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Create PDF Document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // --- Header (Blue) ---
    page.drawRectangle({ x: 0, y: height - 100, width: width, height: 100, color: rgb(0.23, 0.51, 0.96) });
    page.drawText('INVOICE', { x: width / 2 - 60, y: height - 60, size: 32, font: boldFont, color: rgb(1, 1, 1) });   
    
    // --- Shop & Order Info ---
    page.drawText('QuickCart Store', { x: 50, y: height - 140, size: 16, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Order ID: #' + String(order.id).slice(0, 8).toUpperCase(), { x: 50, y: height - 165, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Date: ' + new Date(order.created_at).toLocaleDateString('en-IN'), { x: 50, y: height - 185, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    // --- Customer Info ---
    page.drawText('Bill To:', { x: 50, y: height - 220, size: 13, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText(String(order.customer_name || 'Customer'), { x: 50, y: height - 240, size: 11, font: font, color: rgb(0.12, 0.16, 0.24) });
    if (order.phone) page.drawText('Phone: ' + String(order.phone), { x: 50, y: height - 260, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    if (order.address) page.drawText('Address: ' + String(order.address), { x: 50, y: height - 280, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    // --- Table Header ---    const tableTop = height - 330;
    page.drawRectangle({ x: 50, y: tableTop, width: 495, height: 30, color: rgb(0.23, 0.51, 0.96) });
    page.drawText('#', { x: 60, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Item', { x: 100, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Price', { x: 320, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('GST%', { x: 400, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Total', { x: 470, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });

    // --- Parse Items (Split comma-separated string) ---
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

    let y = tableTop - 30;
    let calculatedSubtotal = 0;
    let gstTotal = 0;

    itemsArray.forEach((item, idx) => {
      const price = item.price;
      const gstRate = item.gst_rate;
      const gst = Math.round(price * gstRate / 100);
      const itemTotal = price + gst;
      calculatedSubtotal += price;
      gstTotal += gst;

      // Alternate row color
      if (idx % 2 === 0) {
        page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 25, color: rgb(0.95, 0.96, 0.97) });
      }

      page.drawText(String(idx + 1), { x: 60, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      
      // Handle long item names
      const itemName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
      page.drawText(itemName, { x: 100, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      
      page.drawText('Rs.' + price, { x: 320, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText(gstRate + '%', { x: 400, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText('Rs.' + itemTotal, { x: 470, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      y -= 30;
    });

    // --- Totals Section ---
    y -= 10;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

    y -= 20;    
    page.drawText('Subtotal:', { x: 350, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Rs.' + calculatedSubtotal, { x: 470, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    y -= 20;
    page.drawText('GST Amount (18%):', { x: 350, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Rs.' + gstTotal, { x: 470, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });

    y -= 25;
    page.drawText('Grand Total:', { x: 350, y: y, size: 14, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Rs.' + (calculatedSubtotal + gstTotal), { x: 470, y: y, size: 14, font: boldFont, color: rgb(0.06, 0.72, 0.51) });

    // --- Footer ---
    page.drawText('Thank you for shopping with us!', { x: width / 2 - 100, y: 60, size: 10, font: font, color: rgb(0.42, 0.45, 0.5) });
    page.drawText('For any queries, contact us.', { x: width / 2 - 80, y: 40, size: 10, font: font, color: rgb(0.42, 0.45, 0.5) });
    page.drawText('QuickCart - Digitizing Your Business', { x: width / 2 - 110, y: 25, size: 10, font: boldFont, color: rgb(0.12, 0.16, 0.24) });

    // 3. Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    console.log('✅ PDF-lib invoice generated, size:', blob.size, 'bytes');

    // 4. Send to Telegram
    if (BOT_TOKEN && chatId) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', blob, `Invoice_${String(order.id).slice(0, 8).toUpperCase()}.pdf`);
      
      const grandTotal = calculatedSubtotal + gstTotal;
      formData.append('caption', `🧾 *Here is your professional invoice for Order #${String(order.id).slice(0, 8).toUpperCase()}*\n\n*Grand Total: Rs.${grandTotal}*\n\nThanks for shopping with us! 🙏`);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const tgResult = await response.json();
      if (tgResult.ok) {
        console.log('📄 Professional invoice sent successfully!');
      } else {        console.error('❌ Telegram send failed:', tgResult);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
