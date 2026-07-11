import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export async function POST(request) {
  try {
    const { order } = await request.json();
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    await new Promise((resolve) => {
      doc.on('end', resolve);
      
      // Header
      doc.fillColor('#3B82F6').rect(0, 0, 595, 100).fill();
      doc.fillColor('#FFFFFF')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('INVOICE', 0, 40, { align: 'center' });
      
      // Shop Info
      doc.fillColor('#000000')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('QuickCart Store', 50, 130)
         .font('Helvetica')
         .fontSize(11)
         .text('Order ID: ' + order.id, 50, 155)
         .text('Date: ' + new Date(order.created_id).toLocaleDateString('en-IN'), 50, 175);
      
      // Customer Info
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .text('Bill To:', 50, 210)
         .font('Helvetica')
         .fontSize(11)
         .text('Phone: ' + order.phone, 50, 235)
         .text('Address: ' + order.address, 50, 255);
      
      // Table Header
      const tableTop = 290;
      doc.fillColor('#3B82F6').rect(50, tableTop, 495, 30).fill();
      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('#', 60, tableTop + 10)
         .text('Item', 100, tableTop + 10)         .text('Qty', 350, tableTop + 10)
         .text('Price', 410, tableTop + 10)
         .text('Total', 470, tableTop + 10);
      
      // Items
      const items = Array.isArray(order.items) ? order.items : [order.items];
      let y = tableTop + 40;
      let totalAmount = 0;
      
      items.forEach((item, idx) => {
        const price = 500;
        const itemTotal = price;
        totalAmount += itemTotal;
        
        if (idx % 2 === 0) {
          doc.fillColor('#F3F4F6').rect(50, y - 5, 495, 25).fill();
        }
        
        doc.fillColor('#000000')
           .font('Helvetica')
           .fontSize(10)
           .text(String(idx + 1), 60, y)
           .text(item, 100, y)
           .text('1', 350, y)
           .text('Rs.' + price, 410, y)
           .text('Rs.' + itemTotal, 470, y);
        
        y += 30;
      });
      
      // Total
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).stroke();
      y += 15;
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#10B981')
         .text('Total Amount: Rs.' + totalAmount, 380, y);
      
      // Footer
      doc.fillColor('#6B7280')
         .fontSize(10)
         .font('Helvetica-Oblique')
         .text('Thank you for shopping with us!', 0, 750, { align: 'center' })
         .text('For any queries, contact us.', 0, 770, { align: 'center' });
      
      doc.end();
    });
        const pdfBuffer = Buffer.concat(buffers);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    return NextResponse.json({ 
      success: true, 
      pdf: pdfBase64,
      filename: 'invoice-' + order.id + '.pdf'
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
