import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { orderId, chatId } = await request.json();

    // 1. Order details fetch karo
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. PDF Generate karo (In-memory)
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // --- PDF DESIGN ---
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Order ID: #${order.id.slice(0, 8).toUpperCase()}`, { align: 'center' });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);
    
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
    doc.font('Helvetica').text(order.customer_name || 'Customer');
    if (order.phone) doc.text(`Phone: ${order.phone}`);
    if (order.address) doc.text(`Address: ${order.address}`);
    doc.moveDown(1);
    
    doc.text('------------------------------------------------');
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Order Details:');
    doc.font('Helvetica').text(order.items || 'N/A');
    doc.moveDown(1);
    
    // Calculation
    const subtotal = Number(order.amount) || 0;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    doc.text(`Subtotal: Rs. ${subtotal}`);
    doc.text(`GST (18%): Rs. ${gst}`);
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(`Total Amount: Rs. ${total}`, { align: 'right' });
    doc.moveDown(2);
    
    doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for shopping with us! 🙏', { align: 'center' });
    doc.text('QuickCart - Digitizing Your Business', { align: 'center' });
    
    doc.end(); // PDF generation complete karo

    const pdfBuffer = await pdfPromise;

    // 3. Telegram par PDF bhejo
    if (BOT_TOKEN && chatId) {
      const formData = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      
      formData.append('chat_id', chatId);
      formData.append('document', blob, `Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
      formData.append('caption', `🧾 *Here is your invoice for Order #${order.id.slice(0, 8).toUpperCase()}*\n\nTotal Paid: Rs. ${total}\n\nThanks for shopping with us! 🙏`);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const tgResult = await response.json();
      console.log('📄 Telegram PDF sent:', tgResult.ok ? 'Success' : tgResult);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
