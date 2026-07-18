import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { orderId, chatId } = await request.json();
    console.log('🧾 Generating professional invoice for order:', orderId);

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

    // 2. PDF Generate karo using jsPDF with AutoTable
    const doc = new jsPDF();
    
    // --- PROFESSIONAL HEADER (Blue) ---
    doc.setFillColor(59, 130, 246); // Blue color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 25, null, null, "center");
    
    // --- STORE INFO ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("QuickCart Store", 20, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: #${order.id.slice(0, 8).toUpperCase()}`, 20, 63);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 20, 69);
        // --- BILL TO ---
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 82);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer_name || "Customer", 20, 88);
    if (order.phone) doc.text(`Phone: ${order.phone}`, 20, 94);
    if (order.address) doc.text(`Address: ${order.address}`, 20, 100);
    
    // --- ITEMS TABLE ---
    const subtotal = Number(order.amount) || 0;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    
    // Parse items (assuming comma-separated)
    const itemsList = (order.items || 'Item').split(',').map(item => item.trim()).filter(item => item);
    
    const tableData = itemsList.map((item, index) => {
      const itemPrice = Math.round(subtotal / itemsList.length);
      const itemGST = Math.round(itemPrice * 0.18);
      const itemTotal = itemPrice + itemGST;
      
      return [
        index + 1,
        item,
        `Rs.${itemPrice}`,
        '18%',
        `Rs.${itemTotal}`
      ];
    });
    
    doc.autoTable({
      startY: 110,
      head: [['#', 'Item', 'Price', 'GST%', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 }
    });
    
    // --- TOTALS ---
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal:`, 150, finalY, null, null, "right");
    doc.text(`Rs.${subtotal}`, 190, finalY, null, null, "right");    
    doc.text(`GST Amount (18%):`, 150, finalY + 7, null, null, "right");
    doc.text(`Rs.${gst}`, 190, finalY + 7, null, null, "right");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74); // Green color
    doc.text(`Grand Total:`, 150, finalY + 16, null, null, "right");
    doc.text(`Rs.${total}`, 190, finalY + 16, null, null, "right");
    
    // --- FOOTER ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for shopping with us!", 105, 270, null, null, "center");
    doc.text("For any queries, contact us.", 105, 275, null, null, "center");
    doc.text("QuickCart - Digitizing Your Business", 105, 280, null, null, "center");

    // 3. PDF ko Buffer mein convert karo
    const pdfBuffer = doc.output('arraybuffer');
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

    console.log('✅ Professional PDF generated, size:', blob.size, 'bytes');

    // 4. Telegram par PDF bhejo
    if (BOT_TOKEN && chatId) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', blob, `Invoice_${order.id.slice(0, 8).toUpperCase()}.pdf`);
      formData.append('caption', `🧾 *Here is your professional invoice for Order #${order.id.slice(0, 8).toUpperCase()}*\n\n*Grand Total: Rs.${total}*\n\nThanks for shopping with us! 🙏`);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const tgResult = await response.json();
      if (tgResult.ok) {
        console.log('📄 Professional invoice sent successfully!');
      } else {
        console.error('❌ Telegram send failed:', tgResult);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Invoice Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }}
