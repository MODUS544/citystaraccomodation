'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Menu, X, Calendar, User, Phone, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#080C15]/90 backdrop-blur-md border-b border-white/10 py-3 shadow-2xl'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Crest */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark/80 group-hover:border-hotel-gold transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Star className="w-5 h-5 text-hotel-gold fill-hotel-gold/20" />
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-white block leading-none">
              CITY STAR
            </span>
            <span className="text-[10px] tracking-[0.25em] text-hotel-gold uppercase font-medium">
              Hotel & Suites
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium tracking-wide">
          <Link
            href="/#rooms"
            className="text-gray-300 hover:text-hotel-gold transition-colors"
          >
            Suites & Rooms
          </Link>
          <Link
            href="/#amenities"
            className="text-gray-300 hover:text-hotel-gold transition-colors"
          >
            Amenities
          </Link>
          <Link
            href="/#experience"
            className="text-gray-300 hover:text-hotel-gold transition-colors"
          >
            Experience
          </Link>
          <Link
            href="/my-bookings"
            className="text-gray-300 hover:text-hotel-gold transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-hotel-gold" />
            My Bookings
          </Link>
          <Link
            href="/login"
            className="text-hotel-gold hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full border border-hotel-gold/40 hover:border-hotel-gold bg-hotel-gold/10 hover:bg-hotel-gold/20 text-xs font-semibold uppercase tracking-wider"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-hotel-gold" />
            Staff Portal
          </Link>
        </nav>

        {/* Action Button & Contact */}
        <div className="hidden lg:flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Phone className="w-3.5 h-3.5 text-hotel-gold" />
            <span>+1 (800) 248-9782</span>
          </div>
          <Link
            href="/#rooms"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-semibold text-xs tracking-wider uppercase hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Reserve a Suite
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white focus:outline-none"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#080C15]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <Link
            href="/#rooms"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-200 hover:text-hotel-gold font-medium text-base py-1"
          >
            Suites & Rooms
          </Link>
          <Link
            href="/#amenities"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-200 hover:text-hotel-gold font-medium text-base py-1"
          >
            Amenities
          </Link>
          <Link
            href="/#experience"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-gray-200 hover:text-hotel-gold font-medium text-base py-1"
          >
            Experience
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
