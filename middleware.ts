import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check karo ki user kya /admin route par ja raha hai
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Check karo ki user ke paas 'isAdmin' cookie hai ya nahi
    const isAdmin = request.cookies.get('isAdmin')?.value;
    
    // Agar admin nahi hai, toh usko wapas Login page par bhej do
    if (isAdmin !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Ye middleware sirf /admin se shuru hone wale routes par kaam karega
export const config = {
  matcher: ['/admin/:path*'],
};
