'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  BedDouble,
  Settings,
  LogOut,
  Star,
  ExternalLink,
  Menu,
  X,
  Shield,
  Loader2,
  Palette,
  DoorOpen,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Reservations', href: '/admin/bookings', icon: CalendarCheck2 },
  { name: 'Room Inventory', href: '/admin/inventory', icon: BedDouble },
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

          if (storedToken && storedEmail && (storedRole === 'admin' || storedRole === 'staff')) {
            hasStaffAuth = true;
            activeEmail = storedEmail;
            activeRole = storedRole;
          }
        }

        // Also check Supabase session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user && session.user.email) {
            const email = session.user.email;
            if (email === 'talbashtech@gmail.com' || activeRole === 'admin') {
              hasStaffAuth = true;
              activeEmail = email;
              activeRole = activeRole || 'admin';
              if (typeof window !== 'undefined') {
                localStorage.setItem('citystar_staff_email', email);
                localStorage.setItem('citystar_staff_role', 'admin');
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

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#080C15] flex items-center justify-center text-hotel-gold">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C15] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A101D] border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark">
            <Star className="w-4 h-4 text-hotel-gold fill-hotel-gold/20" />
          </div>
          <span className="font-serif text-lg font-bold text-white tracking-wider">
            CITY STAR ADMIN
          </span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-[#0A101D] border-r border-white/10 p-6 flex-shrink-0 z-30`}
      >
        {/* Brand Crest */}
        <div className="hidden md:flex items-center gap-3 pb-8 border-b border-white/10">
          <div className="w-10 h-10 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Star className="w-5 h-5 text-hotel-gold fill-hotel-gold/20" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-wider text-white block leading-none">
              CITY STAR
            </span>
            <span className="text-[10px] tracking-[0.2em] text-hotel-gold uppercase font-medium">
              Management Portal
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-8 space-y-1.5 flex-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-hotel-gold/20 to-transparent text-hotel-gold border border-hotel-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-hotel-gold' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Operations & Guest Site Links */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <Link
            href="/frontdesk/walk-in"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-hotel-gold bg-hotel-gold/10 hover:bg-hotel-gold/20 border border-hotel-gold/30 transition-all hover:scale-[1.01]"
          >
            <span className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-hotel-gold" />
              Front Desk Walk-In
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-hotel-gold text-hotel-dark">
              Terminal
            </span>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-hotel-gold" />
              Live Guest Website
            </span>
          </Link>

          {/* User Badge & Logout */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-hotel-gold/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5 text-hotel-gold" />
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider text-hotel-gold font-bold">
                  {staffRole === 'admin' ? 'Super Admin' : 'Staff Console'}
                </div>
                <div className="text-xs text-gray-200 truncate max-w-[130px]" title={staffEmail}>
                  {staffEmail}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
