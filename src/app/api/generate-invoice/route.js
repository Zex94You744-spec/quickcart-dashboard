import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(request) {
  try {
    const { order } = await request.json();
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Header
    page.drawRectangle({ x: 0, y: height - 100, width: width, height: 100, color: rgb(0.23, 0.51, 0.96) });
    page.drawText('INVOICE', { x: width / 2 - 60, y: height - 60, size: 32, font: boldFont, color: rgb(1, 1, 1) });
    
    // Shop & Order Info
    page.drawText('QuickCart Store', { x: 50, y: height - 140, size: 16, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Order ID: ' + String(order.id || 'N/A'), { x: 50, y: height - 165, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Date: ' + new Date(order.created_id || Date.now()).toLocaleDateString('en-IN'), { x: 50, y: height - 185, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    
    // Customer Info
    page.drawText('Bill To:', { x: 50, y: height - 220, size: 13, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Phone: ' + String(order.phone || 'N/A'), { x: 50, y: height - 245, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Address: ' + String(order.address || 'N/A'), { x: 50, y: height - 265, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    
    // Table Header
    const tableTop = height - 310;
    page.drawRectangle({ x: 50, y: tableTop, width: 495, height: 30, color: rgb(0.23, 0.51, 0.96) });
    page.drawText('#', { x: 60, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Item', { x: 100, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Price', { x: 320, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('GST%', { x: 400, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('Total', { x: 470, y: tableTop + 10, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    
    // Items - Parse items properly
    let items = [];
    if (Array.isArray(order.items)) {
      items = order.items.map(item => {
        if (typeof item === 'string') {
          return { name: item, price: 500, gst_rate: 18 };
        } else if (typeof item === 'object' && item !== null) {
          return {
            name: String(item.name || 'Unknown Item'),
            price: Number(item.price) || 500,
            gst_rate: Number(item.gst_rate) || 18
          };        }
        return { name: 'Unknown Item', price: 500, gst_rate: 18 };
      });
    }
    
    let y = tableTop - 30;
    let subtotal = 0;
    let gstTotal = 0;
    
    items.forEach((item, idx) => {
      const price = item.price;
      const gstRate = item.gst_rate;
      const gst = price * gstRate / 100;
      const itemTotal = price + gst;
      subtotal += price;
      gstTotal += gst;
      
      if (idx % 2 === 0) {
        page.drawRectangle({ x: 50, y: y - 5, width: 495, height: 25, color: rgb(0.95, 0.96, 0.97) });
      }
      
      page.drawText(String(idx + 1), { x: 60, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText(item.name, { x: 100, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText('Rs.' + price, { x: 320, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText(gstRate + '%', { x: 400, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      page.drawText('Rs.' + itemTotal.toFixed(2), { x: 470, y: y, size: 10, font: font, color: rgb(0.12, 0.16, 0.24) });
      
      y -= 30;
    });
    
    // Totals Section
    y -= 10;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    
    y -= 20;
    page.drawText('Subtotal:', { x: 350, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Rs.' + subtotal, { x: 470, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    
    y -= 20;
    page.drawText('GST Amount:', { x: 350, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    page.drawText('Rs.' + gstTotal.toFixed(2), { x: 470, y: y, size: 11, font: font, color: rgb(0.3, 0.35, 0.4) });
    
    y -= 25;
    page.drawText('Grand Total:', { x: 350, y: y, size: 14, font: boldFont, color: rgb(0.12, 0.16, 0.24) });
    page.drawText('Rs.' + (subtotal + gstTotal).toFixed(2), { x: 470, y: y, size: 14, font: boldFont, color: rgb(0.06, 0.72, 0.51) });
    
    // Footer
    page.drawText('Thank you for shopping with us!', { x: width / 2 - 100, y: 60, size: 10, font: font, color: rgb(0.42, 0.45, 0.5) });
    page.drawText('For any queries, contact us.', { x: width / 2 - 80, y: 40, size: 10, font: font, color: rgb(0.42, 0.45, 0.5) });
        const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return NextResponse.json({ success: true, pdf: pdfBase64, filename: 'invoice-' + order.id + '.pdf' });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
