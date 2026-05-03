import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  
  // Protect all routes under /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session || session.value !== 'authenticated') {
      // Redirect to login if no valid session
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If trying to access login page while authenticated, redirect to admin
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') {
    if (session && session.value === 'authenticated') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ['/', '/login', '/admin/:path*'],
};
