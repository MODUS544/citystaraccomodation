import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const staffRole = request.cookies.get('citystar_staff_role')?.value;
  const authToken = request.cookies.get('citystar_auth_token')?.value;

  const isStaffOrAdmin = authToken && (staffRole === 'super_admin' || staffRole === 'admin' || staffRole === 'staff' || staffRole === 'receptionist');
  const isSuperAdmin = authToken && (staffRole === 'super_admin' || staffRole === 'admin');

  // Protect /admin routes: Accessible exclusively to Super Admin / Admin
  if (pathname.startsWith('/admin')) {
    if (!isStaffOrAdmin) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If staff (front desk) attempts to enter Super Admin command center, redirect to Front Desk
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/frontdesk/walk-in', request.url));
    }
  }

  // Protect /frontdesk routes: Accessible to Staff, Receptionists, and Super Admins
  if (pathname.startsWith('/frontdesk')) {
    if (!isStaffOrAdmin) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and visiting /login, redirect to respective home portal
  if (pathname === '/login') {
    if (isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (isStaffOrAdmin) {
      return NextResponse.redirect(new URL('/frontdesk/walk-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/frontdesk/:path*', '/login'],
};
