'use client';

import React from 'react';
import Link from 'next/link';
import { Star, MapPin, Mail, Phone, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#05080E] border-t border-white/10 text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark">
                <Star className="w-5 h-5 text-hotel-gold fill-hotel-gold/20" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-wider text-white block leading-none">
                  CITY STAR
                </span>
                <span className="text-[10px] tracking-[0.25em] text-hotel-gold uppercase font-medium">
                  Hotel & Suites
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm font-light leading-relaxed max-w-sm">
              An iconic haven of modern luxury, where timeless hospitality blends effortlessly with state-of-the-art sophistication.
            </p>
            <div className="pt-2 text-xs text-gray-500">
              Target Infrastructure: Render & Supabase
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-hotel-gold font-semibold mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <Link href="/#rooms" className="hover:text-white transition-colors">
                  Suites & Penthouses
                </Link>
              </li>
              <li>
                <Link href="/#amenities" className="hover:text-white transition-colors">
                  Infinity Pool & Spa
                </Link>
              </li>
              <li>
                <Link href="/#experience" className="hover:text-white transition-colors">
                  Michelin Dining
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-white transition-colors">
                  Guest Reservation Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-hotel-gold hover:text-white transition-colors font-medium flex items-center gap-1">
                  <span>Staff & Admin Portal</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-hotel-gold/20 text-hotel-gold uppercase tracking-wider font-semibold">Staff</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-hotel-gold font-semibold mb-4">
              Concierge
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-hotel-gold flex-shrink-0 mt-0.5" />
                <span>450 Grand Star Boulevard, Metropolitan Center</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-hotel-gold flex-shrink-0" />
                <span>+1 (800) 248-9782</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-hotel-gold flex-shrink-0" />
                <span>concierge@citystarhotel.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-hotel-gold font-semibold mb-4">
              Private Journal
            </h4>
            <p className="text-gray-400 text-xs mb-3 font-light">
              Receive private invitations and seasonal retreat packages.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-hotel-gold hover:bg-hotel-gold-hover text-hotel-dark font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
              >
                <span>Subscribe</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>
            © {new Date().getFullYear()} City Star Hotel & Suites. All rights reserved.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-300 cursor-pointer">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
