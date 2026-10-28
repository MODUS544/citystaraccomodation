'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Mail, Phone, ArrowUpRight } from 'lucide-react';
import { fetchPublicSettings } from '../lib/api';

export function Footer() {
  const pathname = usePathname();
  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => fetchPublicSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const logo = siteSettings?.brand_logo;
  const contact = siteSettings?.contact_info;

  // Do not render guest footer on staff or admin portal routes
  const isPortalRoute = Boolean(
    pathname &&
    (pathname.startsWith('/admin') ||
     pathname.startsWith('/staff') ||
     pathname.startsWith('/frontdesk'))
  );

  if (!pathname || isPortalRoute) return null;

  return (
    <footer className="bg-[#05080E] border-t border-white/10 text-white pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full border border-hotel-gold/60 overflow-hidden bg-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Image
                  src={logo?.url || '/city-star-receipt-logo.jpg'}
                  alt={logo?.alt_text || 'City Star Logo'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-wider text-white block leading-none">
                  {contact?.brand_name || logo?.site_title || 'CITY STAR HOTEL & RESTAURANT'}
                </span>
                <span className="text-[10px] tracking-[0.25em] text-hotel-gold uppercase font-medium">
                  {logo?.tag_line || 'Maiduguri’s Premier 5-Star Peace & Elegance'}
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm font-light leading-relaxed max-w-sm">
              {contact?.description ||
                'An iconic haven of modern luxury in Maiduguri, where rich Northern heritage blends effortlessly with state-of-the-art sophistication.'}
            </p>
            <div className="pt-2 text-xs text-hotel-gold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Maiduguri VIP Secure Zone</span>
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
                <Link href="/#experience" className="hover:text-white transition-colors">
                  The Heritage Experience
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-white transition-colors">
                  Guest Reservation Portal
                </Link>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                  Corporate & Diplomatic Accounts
                </span>
              </li>
              <li>
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                  VIP Security & Airport Transfer
                </span>
              </li>
              <li>
                <Link href="/login" className="text-hotel-gold hover:text-white transition-colors font-medium flex items-center gap-1 pt-1">
                  <span>Staff & Operations Portal</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-hotel-gold/20 text-hotel-gold uppercase tracking-wider font-semibold">Staff</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-hotel-gold font-semibold mb-4">
              Location & Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-hotel-gold flex-shrink-0 mt-0.5" />
                <span>{contact?.address || 'City Star Hotel & Restaurant, Yerwa/Yerima Road, Maiduguri, Borno State, Nigeria'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-hotel-gold flex-shrink-0" />
                <a href={`tel:${contact?.phone || '+2349068686675'}`} className="hover:text-white transition-colors">
                  {contact?.phone || '+234 906 868 6675'}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-hotel-gold flex-shrink-0" />
                <a href={`mailto:${contact?.email || 'citystarmaiduguri@gmail.com'}`} className="hover:text-white transition-colors">
                  {contact?.email || 'citystarmaiduguri@gmail.com'}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-hotel-gold font-semibold mb-4">
              Private VIP Newsletter
            </h4>
            <p className="text-gray-400 text-xs mb-3 font-light">
              Receive private invitations, VIP rate offers, and seasonal retreat packages.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold via-[#E6CA65] to-[#AA820A] text-hotel-dark font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
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
            {contact?.copyright || `© ${new Date().getFullYear()} City Star Hotel & Suites, Maiduguri. All rights reserved.`}
          </div>
          <div className="flex gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-300 cursor-pointer">Security & Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
