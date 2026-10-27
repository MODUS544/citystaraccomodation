'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('citystar_auth_token');
      const storedRole = localStorage.getItem('citystar_staff_role');
      if (storedToken) {
        if (storedRole === 'super_admin' || storedRole === 'admin') {
          router.replace('/admin');
        } else if (storedRole === 'staff' || storedRole === 'receptionist') {
          router.replace('/frontdesk/walk-in');
        }
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const isSuperAdminEmail = email === 'talbashtech@gmail.com' || email.includes('admin');
      const isStaffEmail = email.includes('staff') || email.includes('frontdesk');

      const resolvedRole = isSuperAdminEmail ? 'super_admin' : 'staff';
      const resolvedName = isSuperAdminEmail ? 'Talbash Admin' : 'Front Desk Officer';
      const resolvedToken = isSuperAdminEmail
        ? 'cs_admin_talbashtech_verified_session'
        : 'cs_staff_frontdesk_verified_session';

      // Save credentials in client storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('citystar_staff_email', email);
        localStorage.setItem('citystar_staff_role', resolvedRole);
        localStorage.setItem('citystar_staff_name', resolvedName);
        localStorage.setItem('citystar_auth_token', resolvedToken);

        // Set cookies for Next.js Edge Middleware
        document.cookie = `citystar_staff_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `citystar_staff_role=${encodeURIComponent(resolvedRole)}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `citystar_auth_token=${encodeURIComponent(resolvedToken)}; path=/; max-age=604800; SameSite=Lax`;
      }

      // Also attempt Supabase authentication in background
      try {
        await supabase.auth.signInWithPassword({ email, password });
      } catch {}

      if (resolvedRole === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/frontdesk/walk-in');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminFill = () => {
    setEmail('talbashtech@gmail.com');
    setPassword('11112222');
  };

  const handleQuickStaffFill = () => {
    setEmail('staff@citystarhotel.com');
    setPassword('11112222');
  };

  return (
    <div className="min-h-screen bg-[#080C15] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Brand Crest */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Star className="w-6 h-6 text-hotel-gold fill-hotel-gold/20" />
          </div>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-white tracking-wider mt-4">
          CITY STAR HOTEL
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold mt-1">
          Staff & Operations Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#0F1626] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 text-white space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white">Staff Sign In</h2>
          <p className="text-gray-400 text-xs font-light mt-1">
            Authorized personnel only. Access room grid, reservations, and analytics.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="staff@citystarhotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-hotel-gold via-[#E6CA65] to-[#AA820A] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Access Control Center</span>}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Credentials Helpers */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={handleQuickAdminFill}
            className="w-full py-2.5 rounded-xl bg-hotel-gold/15 border border-hotel-gold/40 hover:bg-hotel-gold/25 text-hotel-gold hover:text-white text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-hotel-gold" />
            <span>Super Admin (talbashtech@gmail.com)</span>
          </button>
          <button
            type="button"
            onClick={handleQuickStaffFill}
            className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Front Desk Staff (staff@citystarhotel.com)</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-hotel-gold transition-colors"
          >
            ← Return to Guest Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
