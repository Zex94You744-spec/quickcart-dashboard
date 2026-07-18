import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { orderId, chatId } = await request.json();
    console.log('🧾 Generating invoice for order:', orderId, 'chatId:', chatId);

    // 1. Order details fetch karo
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Order not found:', error);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. PDF Generate karo using jsPDF (Vercel compatible)
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: #${order.id.slice(0, 8).toUpperCase()}`, 105, 30, null, null, "center");
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 105, 38, null, null, "center");
    
    // Bill To
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer_name || "Customer", 20, 68);
    if (order.phone) doc.text(`Phone: ${order.phone}`, 20, 76);
    if (order.address) doc.text(`Address: ${order.address}`, 20, 84);
    
    // Separator Line
    doc.setLineWidth(0.5);
    doc.line(20, 95, 190, 95);    
    // Order Details
    doc.setFont("helvetica", "bold");
    doc.text("Order Details:", 20, 110);
    doc.setFont("helvetica", "normal");
    
    // Text ko wrap karo taaki page se bahar na jaye
    const splitItems = doc.splitTextToSize(order.items || "N/A", 170);
    doc.text(splitItems, 20, 120);
    
    // Calculation
    const subtotal = Number(order.amount) || 0;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    
    const yPos = 120 + (splitItems.length * 7) + 15;
    
    doc.text(`Subtotal: Rs. ${subtotal}`, 190, yPos, null, null, "right");
    doc.text(`GST (18%): Rs. ${gst}`, 190, yPos + 8, null, null, "right");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total Amount: Rs. ${total}`, 190, yPos + 20, null, null, "right");
    
    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for shopping with us! 🙏", 105, 270, null, null, "center");
    doc.text("QuickCart - Digitizing Your Business", 105, 278, null, null, "center");

    // 3. PDF ko Blob mein convert karo
    const pdfBuffer = doc.output('arraybuffer');
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

    console.log('✅ PDF Buffer generated, size:', blob.size, 'bytes');

    // 4. Telegram par PDF bhejo
    if (BOT_TOKEN && chatId) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', blob, `Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
      formData.append('caption', `🧾 *Here is your invoice for Order #${order.id.slice(0, 8).toUpperCase()}*\n\nSubtotal: Rs. ${subtotal}\nGST (18%): Rs. ${gst}\n*Total Paid: Rs. ${total}*\n\nThanks for shopping with us! 🙏`);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const tgResult = await response.json();      if (tgResult.ok) {
        console.log('📄 Telegram PDF sent successfully!');
      } else {
        console.error('❌ Telegram sendDocument failed:', tgResult);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
