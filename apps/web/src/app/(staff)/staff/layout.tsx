'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  CalendarCheck2,
  Users,
  BedDouble,
  DoorOpen,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  Menu,
  X,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';

const STAFF_NAV_ITEMS = [
  { name: 'Operations & Queue', href: '/staff/dashboard', icon: CalendarCheck2 },
  { name: 'Express Walk-In', href: '/frontdesk/walk-in', icon: DoorOpen },
  { name: 'Room Inventory', href: '/admin/inventory', icon: BedDouble },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState('staff@citystarhotel.com');
  const [staffName, setStaffName] = useState('Front Desk Officer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('citystar_staff_email');
      const name = localStorage.getItem('citystar_staff_name');
      if (email) setStaffEmail(email);
      if (name) setStaffName(name);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('citystar_auth_token');
      localStorage.removeItem('citystar_staff_role');
      localStorage.removeItem('citystar_staff_email');
      localStorage.removeItem('citystar_staff_name');

      document.cookie = 'citystar_auth_token=; path=/; max-age=0';
      document.cookie = 'citystar_staff_role=; path=/; max-age=0';
      document.cookie = 'citystar_staff_email=; path=/; max-age=0';
    }
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#1E2538] flex flex-col antialiased selection:bg-[#135846] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#EAEFF4] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/staff/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#135846] flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
              CS
            </div>
            <div>
              <div className="font-serif font-bold text-base text-[#1E2538] leading-tight">
                CITY STAR HOTEL
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#135846] font-bold">
                Front Desk & Staff Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F8F0] text-[#135846] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#135846] animate-pulse" />
            <span>Front Desk Live</span>
          </div>

          <div className="flex items-center gap-3 pl-2 border-l border-[#EAEFF4]">
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-xs text-[#1E2538]">{staffName}</div>
              <div className="text-[10px] text-[#818E9B]">{staffEmail}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-[#FE5757] hover:bg-[#FFEBEB] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-[#EAEFF4] p-5 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-xs uppercase tracking-wider text-[#818E9B] font-bold px-3">
              Operations Center
            </div>
            <nav className="space-y-1.5">
              {STAFF_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#135846] text-white shadow-sm'
                        : 'text-[#556376] hover:text-[#1E2538] hover:bg-[#F4F6F9]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEFF4] text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#135846] font-bold">
              <Shield className="w-4 h-4" />
              <span>5-Star Hospitality</span>
            </div>
            <p className="text-[11px] text-[#818E9B] leading-relaxed">
              Verify guest booking code upon mobile arrival, or record desk cash/POS payment.
            </p>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
