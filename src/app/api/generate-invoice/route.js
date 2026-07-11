import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function POST(request) {
  try {
    const { order } = await request.json();
    
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Shop Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('QuickCart Store', 14, 55);
    doc.text('Order ID: ' + order.id, 14, 62);
    doc.text('Date: ' + new Date(order.created_id).toLocaleDateString(), 14, 69);
    
    // Customer Info
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 85);
    doc.setFont('helvetica', 'normal');
    doc.text('Phone: ' + order.phone, 14, 92);
    doc.text('Address: ' + order.address, 14, 99);
    
    // Items Table
    const items = Array.isArray(order.items) ? order.items : [order.items];
    const tableData = items.map((item, idx) => [
      idx + 1,
      item,
      '1',
      '₹500',
      '₹500'
    ]);
    
    doc.autoTable({
      startY: 110,
      head: [['#', 'Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 }
    });
    
    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount: ₹' + (items.length * 500), 150, finalY);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('Thank you for shopping with us!', 105, 280, { align: 'center' });
    doc.text('For any queries, contact us.', 105, 287, { align: 'center' });
    
    // Convert to Base64
    const pdfBase64 = doc.output('base64');
    
    return NextResponse.json({ 
      success: true, 
      pdf: pdfBase64,
      filename: `invoice-${order.id}.pdf`
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
