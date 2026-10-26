'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, BedDouble, Search, Sparkles } from 'lucide-react';

export function HeroSearch() {
  const router = useRouter();

  // Initialize sensible default dates
  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 1);
  const defaultCheckOut = new Date(today);
  defaultCheckOut.setDate(today.getDate() + 3);

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(formatDateForInput(defaultCheckIn));
  const [checkOut, setCheckOut] = useState(formatDateForInput(defaultCheckOut));
  const [guests, setGuests] = useState('2');
  const [roomType, setRoomType] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests,
      ...(roomType !== 'all' ? { type: roomType } : {}),
    });
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Image with Dark & Gold Gradients */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C15] via-[#080C15]/70 to-[#080C15]/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center z-10 w-full">
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-hotel-gold/30 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-4 h-4 text-hotel-gold" />
          <span className="text-xs uppercase tracking-[0.2em] text-hotel-gold font-medium">
            Five-Star Urban Sanctuary
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
          Elegance Redefined, <br />
          <span className="bg-gradient-to-r from-hotel-gold-light via-hotel-gold to-[#AA820A] bg-clip-text text-transparent">
            Luxury Realized
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-gray-300 text-base sm:text-lg font-light leading-relaxed mb-10">
          Immerse yourself in bespoke hospitality, panoramic skyline vistas, and world-class culinary masterpieces in the heart of the metropolis.
        </p>

        {/* Interactive Booking Widget */}
        <div className="bg-[#0F1626]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Check-In */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-hotel-gold transition-colors">
              <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-hotel-gold" />
                Check-In Date
              </label>
              <input
                type="date"
                value={checkIn}
                min={formatDateForInput(today)}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Check-Out */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-hotel-gold transition-colors">
              <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-hotel-gold" />
                Check-Out Date
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || formatDateForInput(today)}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Guests */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-hotel-gold transition-colors">
              <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-hotel-gold" />
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
              >
                <option value="1" className="bg-[#0F1626] text-white">1 Adult</option>
                <option value="2" className="bg-[#0F1626] text-white">2 Adults</option>
                <option value="3" className="bg-[#0F1626] text-white">3 Guests</option>
                <option value="4" className="bg-[#0F1626] text-white">4+ Family Suite</option>
              </select>
            </div>

            {/* Submit CTA */}
            <div className="flex items-center">
              <button
                type="submit"
                className="w-full h-full min-h-[50px] rounded-xl bg-gradient-to-r from-hotel-gold via-[#E6CA65] to-[#AA820A] text-hotel-dark font-bold text-sm tracking-wider uppercase hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-hotel-dark" />
                Check Availability
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
