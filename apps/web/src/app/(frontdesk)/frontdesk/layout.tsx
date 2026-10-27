'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UserPlus,
  CalendarCheck2,
  LogOut,
  Star,
  ExternalLink,
  Menu,
  X,
  Shield,
  Loader2,
  Clock,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function FrontDeskLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffRole, setStaffRole] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth check
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

          if (storedToken && storedEmail) {
            hasStaffAuth = true;
            activeEmail = storedEmail;
            activeRole = storedRole || 'staff';
          }
        }

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user && session.user.email) {
            hasStaffAuth = true;
            activeEmail = session.user.email;
            activeRole = activeRole || 'staff';
          }
        } catch (supabaseErr) {
          console.warn('Supabase session check in frontdesk:', supabaseErr);
        }

        if (!hasStaffAuth) {
          router.replace('/login');
          return;
        }

        setStaffEmail(activeEmail);
        setStaffRole(activeRole);
        setIsLoadingAuth(false);
      } catch (err) {
        console.warn('Front desk auth check error:', err);
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
        document.cookie = 'citystar_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'citystar_staff_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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

  const isSuperAdmin = staffRole === 'super_admin' || staffRole === 'admin';

  return (
    <div className="min-h-screen bg-[#080C15] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A101D] border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark">
            <Star className="w-4 h-4 text-hotel-gold fill-hotel-gold/20" />
          </div>
          <div>
            <span className="font-serif text-sm font-bold text-white tracking-wider block">
              CITY STAR FRONT DESK
            </span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Terminal Live
            </span>
          </div>
        </div>
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
        {/* Brand Crest & Terminal Badge */}
        <div className="hidden md:flex flex-col pb-6 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Star className="w-5 h-5 text-hotel-gold fill-hotel-gold/20" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-wider text-white block leading-none">
                CITY STAR
              </span>
              <span className="text-[10px] tracking-[0.2em] text-hotel-gold uppercase font-medium">
                Front Desk Terminal
              </span>
            </div>
          </div>

          {/* Active Shift Card */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300 font-medium">Active Shift</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-hotel-gold font-mono">
              <Clock className="w-3 h-3" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5 flex-1">
          <Link
            href="/frontdesk/walk-in"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
              pathname === '/frontdesk/walk-in'
                ? 'bg-gradient-to-r from-hotel-gold/20 to-transparent text-hotel-gold border border-hotel-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4 text-hotel-gold" />
            <span>Walk-In Registration</span>
          </Link>

          <Link
            href="/admin/bookings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
              pathname === '/admin/bookings'
                ? 'bg-gradient-to-r from-hotel-gold/20 to-transparent text-hotel-gold border border-hotel-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 text-hotel-gold" />
            <span>Reservations & Check-In</span>
          </Link>

          {/* Super Admin Switcher */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-4 mb-2 block">
                Privileged Access
              </span>
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-hotel-gold hover:bg-hotel-gold/10 transition-colors border border-hotel-gold/20"
              >
                <LayoutDashboard className="w-4 h-4 text-hotel-gold" />
                <span>Super Admin Portal</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer & User Badge */}
        <div className="pt-6 border-t border-white/10 space-y-3">
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

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-hotel-gold/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5 text-hotel-gold" />
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{isSuperAdmin ? 'Super Admin' : 'Front Desk Officer'}</span>
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
