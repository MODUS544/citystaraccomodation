import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const staffRole = request.cookies.get('citystar_staff_role')?.value;
  const staffEmail = request.cookies.get('citystar_staff_email')?.value ? decodeURIComponent(request.cookies.get('citystar_staff_email')!.value) : '';
  const authToken = request.cookies.get('citystar_auth_token')?.value;

  const isExplicitAdmin = staffEmail === 'madambashir2@gmail.com' || staffEmail === 'talbashtech@gmail.com';
  const isAuthenticated = Boolean(authToken) || isExplicitAdmin;
  const isSuperAdmin = isExplicitAdmin || (isAuthenticated && (staffRole === 'super_admin' || staffRole === 'admin'));
  const isStaff = isAuthenticated && (staffRole === 'staff' || staffRole === 'receptionist');
  const isStaffOrAdmin = isSuperAdmin || isStaff;

  // Redirect bare /staff to /staff/dashboard
  if (pathname === '/staff' || pathname === '/staff/') {
    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
  }

  // 1. Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Executive Analytics and Brand CMS are restricted to Super Admin
    const isExecutiveRoute =
      pathname === '/admin/dashboard' ||
      pathname.startsWith('/admin/dashboard/') ||
      pathname === '/admin/branding' ||
      pathname.startsWith('/admin/branding/');

    if (isExecutiveRoute && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
  }

  // 2. Protect /staff routes: Accessible to Staff & Super Admin
  if (pathname.startsWith('/staff')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isStaffOrAdmin) {
      return NextResponse.redirect(new URL('/rooms', request.url));
    }
  }

  // 3. Protect /frontdesk routes: Accessible to Staff & Super Admin
  if (pathname.startsWith('/frontdesk')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. If already authenticated and visiting /login, redirect to respective home portal
  if (pathname === '/login') {
    if (isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (isStaff) {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url));
    }
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/rooms', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/frontdesk/:path*', '/login'],
};
