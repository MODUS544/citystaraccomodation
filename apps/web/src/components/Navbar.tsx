'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, Menu, X, Calendar, User, Phone, ShieldCheck } from 'lucide-react';
import { fetchPublicSettings } from '../lib/api';

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => fetchPublicSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const logo = siteSettings?.brand_logo;
  const contact = siteSettings?.contact_info;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Do not render guest navbar on staff or admin portal routes to avoid header collisions
  const isPortalRoute = Boolean(
    pathname &&
    (pathname.startsWith('/admin') ||
     pathname.startsWith('/staff') ||
     pathname.startsWith('/frontdesk'))
  );

  if (!pathname || isPortalRoute) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#080C15]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-2xl'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Crest */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-11 h-11 rounded-full border border-hotel-gold/60 overflow-hidden bg-hotel-dark/80 group-hover:border-hotel-gold transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Image
              src={logo?.url || '/city-star-receipt-logo.jpg'}
              alt={logo?.alt_text || 'City Star Logo'}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div>
            <span className="font-serif text-lg sm:text-2xl font-bold tracking-wider text-white block leading-none">
              {logo?.site_title || 'CITY STAR'}
            </span>
            <span className="text-[10px] tracking-[0.25em] text-hotel-gold uppercase font-medium">
              {logo?.tag_line || 'Hotel & Suites'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-8 text-xs xl:text-sm font-medium tracking-wide flex-shrink-0">
          <Link
            href="/#rooms"
            className="text-gray-300 hover:text-hotel-gold transition-colors whitespace-nowrap"
          >
            Suites & Rooms
          </Link>
          <Link
            href="/#experience"
            className="text-gray-300 hover:text-hotel-gold transition-colors whitespace-nowrap"
          >
            The Experience
          </Link>
          <Link
            href="/my-bookings"
            className="text-gray-300 hover:text-hotel-gold transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-hotel-gold" />
            My Bookings
          </Link>
          <Link
            href="/login"
            className="text-hotel-gold hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full border border-hotel-gold/40 hover:border-hotel-gold bg-hotel-gold/10 hover:bg-hotel-gold/20 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-hotel-gold" />
            Staff Portal
          </Link>
        </nav>

        {/* Action Button & Contact */}
        <div className="hidden xl:flex items-center gap-5 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
            <Phone className="w-3.5 h-3.5 text-hotel-gold" />
            <span>{contact?.phone || '+234 906 868 6675'}</span>
          </div>
          <Link
            href="/#rooms"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-semibold text-xs tracking-wider uppercase hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            Reserve a Suite
          </Link>
        </div>

        {/* Mobile / Tablet Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-gray-300 hover:text-white focus:outline-none flex-shrink-0"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile / Tablet Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#080C15]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <Link
            href="/#rooms"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-200 hover:text-hotel-gold font-medium text-base py-1"
          >
            Suites & Rooms
          </Link>
          <Link
            href="/#experience"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-200 hover:text-hotel-gold font-medium text-base py-1"
          >
            The Experience
          </Link>
          <Link
            href="/my-bookings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 text-gray-200 hover:text-hotel-gold font-medium text-base py-1"
          >
            <Calendar className="w-4 h-4 text-hotel-gold" />
            My Bookings
          </Link>
          <Link
            href="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 text-hotel-gold hover:text-white font-medium text-base py-1"
          >
            <ShieldCheck className="w-4 h-4 text-hotel-gold" />
            Staff & Admin Portal
          </Link>
          <div className="pt-4 border-t border-white/10">
            <Link
              href="/#rooms"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center py-3 rounded-full bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-semibold text-xs tracking-wider uppercase"
            >
              Reserve a Suite
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
