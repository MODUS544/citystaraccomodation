'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  CalendarCheck2,
  BedDouble,
  Palette,
  DoorOpen,
  ExternalLink,
  Menu,
  X,
  Shield,
  Loader2,
  LogOut,
  Search,
  Heart,
  Mail,
  Bell,
  MessageSquare,
  Settings,
  Droplet,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const NAVIGATION_ITEMS = [
  { name: 'Executive Analytics', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Operations & Queue', href: '/admin', icon: CalendarCheck2 },
  { name: 'Guest List', href: '/admin/bookings', icon: CalendarCheck2 },
  { name: 'Room Inventory & Rates', href: '/admin/inventory', icon: BedDouble },
  { name: 'Brand & Media CMS', href: '/admin/branding', icon: Palette },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffRole, setStaffRole] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      try {
        let hasStaffAuth = false;
        let activeEmail = '';
        let activeRole = '';

        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('citystar_auth_token');
          const storedEmail = localStorage.getItem('citystar_staff_email');
          const storedRole = localStorage.getItem('citystar_staff_role');

          if (storedToken && storedEmail && (storedRole === 'super_admin' || storedRole === 'admin')) {
            hasStaffAuth = true;
            activeEmail = storedEmail;
            activeRole = storedRole;
          } else if (storedEmail === 'madambashir2@gmail.com' || storedEmail === 'talbashtech@gmail.com') {
            hasStaffAuth = true;
            activeEmail = storedEmail;
            activeRole = 'super_admin';
            localStorage.setItem('citystar_staff_role', 'super_admin');
            if (!storedToken) {
              const fallbackToken = `cs_admin_${encodeURIComponent(storedEmail)}_${Date.now()}`;
              localStorage.setItem('citystar_auth_token', fallbackToken);
            }
          } else if (storedToken && storedEmail && (storedRole === 'staff' || storedRole === 'receptionist')) {
            router.replace('/frontdesk/walk-in');
            return;
          }
        }

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user && session.user.email) {
            const email = session.user.email;
            if (
              email === 'madambashir2@gmail.com' ||
              email === 'talbashtech@gmail.com' ||
              activeRole === 'super_admin' ||
              activeRole === 'admin'
            ) {
              hasStaffAuth = true;
              activeEmail = email;
              activeRole = activeRole || 'super_admin';
              if (typeof window !== 'undefined') {
                localStorage.setItem('citystar_staff_email', email);
                localStorage.setItem('citystar_staff_role', activeRole);
              }
            }
          }
        } catch (supabaseErr) {
          console.warn('Supabase session check:', supabaseErr);
        }

        if (!hasStaffAuth) {
          router.replace('/login');
          return;
        }

        setStaffEmail(activeEmail);
        setStaffRole(activeRole);
        setIsLoadingAuth(false);
      } catch (err) {
        console.warn('Session verification notice:', err);
        router.replace('/login');
      }
    }
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('citystar_staff_email');
        localStorage.removeItem('citystar_staff_role');
        localStorage.removeItem('citystar_staff_name');
        localStorage.removeItem('citystar_auth_token');
      }
      await supabase.auth.signOut();
    } catch {}
    router.replace('/login');
  };

  const getPageTitle = () => {
    if (pathname === '/admin/bookings') return 'Guest List';
    if (pathname === '/admin/inventory') return 'Room Inventory';
    if (pathname === '/admin/branding') return 'Brand & Media CMS';
    return 'Dashboard Overview';
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center text-[#135846] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#135846]" />
        <span className="text-xs uppercase font-bold tracking-widest text-gray-500">Loading City Star Console...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#1E2538] flex flex-col md:flex-row relative">
      {/* Floating Settings Widgets (from reference image) */}
      <div className="fixed right-0 top-1/2 -translate-y-10 z-40 flex flex-col gap-1.5 no-print">
        <button
          type="button"
          onClick={() => router.push('/admin/branding')}
          title="Branding & Visual Settings"
          className="bg-[#FE5757] hover:bg-[#E84848] text-white p-2.5 rounded-l-xl shadow-lg transition-transform hover:scale-105 active:scale-95 group"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/bookings')}
          title="Theme Quick Switch"
          className="bg-[#4A85F6] hover:bg-[#3972E0] text-white p-2.5 rounded-l-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Droplet className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-white border-r border-[#EAEFF4] flex-shrink-0 z-30 transition-all shadow-[2px_0_20px_rgba(0,0,0,0.02)]`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#EAEFF4]">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#1C1E24] p-1 border border-gray-200/50 flex items-center justify-center relative overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <Image
                src="/city-star-receipt-logo.jpg"
                alt="City Star Logo"
                fill
                unoptimized
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#1E2538] block leading-none font-sans">
                City Star
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide block mt-1">
                Hotel Admin Dashboard
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-3 mb-2">
            Main Menu
          </div>
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all group ${
                    isActive
                      ? 'bg-[#FFF5F5] text-[#FE5757] font-bold shadow-sm'
                      : 'text-gray-600 hover:text-[#1E2538] hover:bg-gray-50 hover:translate-x-1'
                  }`}
                >
                  {/* Travl Red Active Left Edge Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#FE5757]" />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#FE5757]' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Shortcuts */}
          <div className="mt-8 pt-4 border-t border-[#EAEFF4]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-3 mb-2">
              Operations
            </div>
            <div className="space-y-1">
              <Link
                href="/frontdesk/walk-in"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#135846] bg-[#EBF7F2] hover:bg-[#D5EFE4] transition-all"
              >
                <span className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-[#135846]" />
                  Front Desk Walk-In
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#135846] text-white">
                  Terminal
                </span>
              </Link>

              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:text-[#1E2538] hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  Live Guest Website
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#EAEFF4] bg-[#FAFBFC]">
          <div className="p-3 rounded-2xl bg-white border border-[#EAEFF4] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#FE5757]/10 text-[#FE5757] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                CS
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider text-[#135846] font-bold">
                  {staffRole === 'admin' ? 'Super Admin' : 'Staff Manager'}
                </div>
                <div className="text-xs text-gray-700 font-medium truncate max-w-[120px]" title={staffEmail}>
                  {staffEmail}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-[#FE5757] hover:bg-[#FFEBEB] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (matches Travl header from reference) */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#EAEFF4] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E2538] font-sans">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Center: Search Pill Input */}
          <div className="hidden lg:flex items-center relative flex-1 max-w-md mx-6">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reservations, rooms, guests..."
              className="w-full bg-[#F4F6F9] border border-transparent focus:border-[#135846] focus:bg-white rounded-full pl-11 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all"
            />
          </div>

          {/* Right: Quick Action Notification Icons (with red counter pills from reference) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Heart / Favorites */}
            <button
              type="button"
              title="Favorites"
              className="p-2.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>

            {/* Messages with Red Badge 76 */}
            <button
              type="button"
              title="Messages"
              className="relative p-2.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FE5757] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                76
              </span>
            </button>

            {/* Notifications with Red Badge 4 */}
            <button
              type="button"
              title="Alerts"
              className="relative p-2.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FE5757] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                4
              </span>
            </button>

            {/* Notes with Red Badge 35 */}
            <button
              type="button"
              title="Concierge Notes"
              className="relative p-2.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FE5757] text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                35
              </span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-gray-200">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-[#FE5757]/20 flex-shrink-0 bg-[#1C1E24]">
                <Image
                  src="/city-star-receipt-logo.jpg"
                  alt="Staff Avatar"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-[#1E2538] block leading-tight">
                  Talbash Admin
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Hotel Manager
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-slide-up">
          {children}
        </main>
      </div>
    </div>
  );
}
