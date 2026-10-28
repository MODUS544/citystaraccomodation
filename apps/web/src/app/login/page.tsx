'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('citystar_auth_token');
      const storedRole = localStorage.getItem('citystar_staff_role');
      if (storedToken) {
        if (storedRole === 'super_admin' || storedRole === 'admin') {
          router.replace('/admin/dashboard');
        } else if (storedRole === 'staff' || storedRole === 'receptionist') {
          router.replace('/staff/dashboard');
        } else {
          router.replace('/rooms');
        }
      }
    }
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        // 1. Sign Up flow (defaults to role = customer)
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
              role: 'customer',
            },
          },
        });

        if (authErr) throw authErr;

        const userId = authData.user?.id;
        if (userId) {
          // Ensure profile is in public.profiles with role = customer
          await supabase.from('profiles').upsert({
            id: userId,
            email,
            full_name: fullName || email.split('@')[0],
            phone_number: phone || null,
            role: 'customer',
          });
        }

        // Set client session
        setClientSession(email, 'customer', fullName || 'Valued Guest', authData.session?.access_token || 'cs_customer_token');
        setSuccessMsg('Account created successfully! Welcome to City Star Hotel & Suites.');
        setTimeout(() => {
          router.push(redirectTarget || '/rooms');
        }, 800);
      } else {
        // 2. Sign In flow
        let resolvedRole: 'customer' | 'staff' | 'super_admin' = 'customer';
        let resolvedName = email.split('@')[0];
        let accessToken = 'cs_session_token_' + Date.now();

        // Check Supabase Auth
        try {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInErr) {
            // Check known hardcoded demo accounts if test password matches
            if (email === 'talbashtech@gmail.com' && password === '11112222') {
              resolvedRole = 'super_admin';
              resolvedName = 'Talbash Super Admin';
            } else if (
              (email.includes('staff') || email.includes('reception') || email.includes('frontdesk')) &&
              (password === '11112222' || password === 'CityStar2026!')
            ) {
              resolvedRole = 'staff';
              resolvedName = 'Front Desk Officer';
            } else {
              throw signInErr;
            }
          } else if (signInData.user) {
            accessToken = signInData.session?.access_token || accessToken;
            // Fetch profile role from public.profiles
            const { data: prof } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', signInData.user.id)
              .single();

            if (prof) {
              resolvedRole = (prof.role as any) === 'admin' ? 'super_admin' : (prof.role as any);
              resolvedName = prof.full_name || resolvedName;
            } else {
              resolvedRole = (signInData.user.user_metadata?.role as any) || 'customer';
              resolvedName = signInData.user.user_metadata?.full_name || resolvedName;
            }
          }
        } catch (supabaseErr: any) {
          // Fallback whitelist check for rapid testing
          if (email === 'talbashtech@gmail.com' && password === '11112222') {
            resolvedRole = 'super_admin';
            resolvedName = 'Talbash Super Admin';
          } else if (
            (email.includes('staff') || email.includes('reception')) &&
            (password === '11112222' || password === 'CityStar2026!')
          ) {
            resolvedRole = 'staff';
            resolvedName = 'Front Desk Staff';
          } else {
            throw supabaseErr;
          }
        }

        setClientSession(email, resolvedRole, resolvedName, accessToken);

        // Redirect based on role
        if (redirectTarget) {
          router.push(redirectTarget);
        } else if (resolvedRole === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (resolvedRole === 'staff') {
          router.push('/staff/dashboard');
        } else {
          router.push('/rooms');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setClientSession = (email: string, role: string, name: string, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('citystar_staff_email', email);
      localStorage.setItem('citystar_staff_role', role);
      localStorage.setItem('citystar_staff_name', name);
      localStorage.setItem('citystar_auth_token', token);

      document.cookie = `citystar_staff_email=${encodeURIComponent(email)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `citystar_staff_role=${encodeURIComponent(role)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `citystar_auth_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  return (
    <div className="min-h-screen bg-[#080C15] flex flex-col items-center justify-center p-4 pt-32 pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,88,70,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Brand Crest */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-14 h-14 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <Star className="w-7 h-7 text-hotel-gold fill-hotel-gold/20" />
          </div>
        </Link>
        <h1 className="font-serif text-3xl font-bold text-white tracking-wider mt-4">
          CITY STAR HOTEL & SUITES
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold mt-1">
          Maiduguri, Borno State • Premier 5-Star Luxury
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-[#0F1626] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 text-white space-y-6">
        {/* Toggle Mode: Sign In vs Sign Up */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'signin'
                ? 'bg-hotel-gold text-hotel-dark font-bold shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-hotel-gold text-hotel-dark font-bold shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Guest Account
          </button>
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold text-white">
            {mode === 'signin' ? 'Sign In to Your Account' : 'New Guest Registration'}
          </h2>
          <p className="text-gray-400 text-xs font-light mt-1">
            {mode === 'signin'
              ? 'Enter your credentials to access your booking folios or staff portal.'
              : 'Register to reserve luxury suites with priority date locking in Maiduguri.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Alhaji Mustapha Mai"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+234 803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold">
              Password
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
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In Securely' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Role Fill Presets for Instant Role Demo Testing */}
        <div className="pt-4 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-2 font-semibold text-center">
            Instant Demo Access By Role
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setEmail('talbashtech@gmail.com');
                setPassword('11112222');
              }}
              className="px-2 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-hotel-gold hover:text-hotel-gold transition-colors text-center"
            >
              <div className="font-bold text-[11px]">Super Admin</div>
              <div className="text-[9px] text-gray-400">Executive</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setEmail('staff@citystarhotel.com');
                setPassword('11112222');
              }}
              className="px-2 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-hotel-gold hover:text-hotel-gold transition-colors text-center"
            >
              <div className="font-bold text-[11px]">Staff</div>
              <div className="text-[9px] text-gray-400">Front Desk</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setEmail('guest@citystarhotel.com');
                setPassword('GuestPass2026!');
              }}
              className="px-2 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-hotel-gold hover:text-hotel-gold transition-colors text-center"
            >
              <div className="font-bold text-[11px]">Customer</div>
              <div className="text-[9px] text-gray-400">Guest Portal</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080C15] flex items-center justify-center text-hotel-gold">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
