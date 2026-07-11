import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/InvoicePDF';

export async function POST(request) {
  try {
    const { order } = await request.json();
    
    // PDF render karo
    const pdfBuffer = await renderToBuffer(<InvoicePDF order={order} />);
    const pdfBase64 = pdfBuffer.toString('base64');
    
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
