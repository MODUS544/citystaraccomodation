'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchAvailableRooms, fetchRoomTypes } from '../../lib/api';
import { RoomCard } from '../../components/RoomCard';
import { BookingModal } from '../../components/BookingModal';
import { RoomType } from '../../types';
import { Calendar, Users, Filter, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function RoomsContent() {
  const searchParams = useSearchParams();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const initialCheckIn = searchParams.get('checkIn') || todayStr;
  const initialCheckOut = searchParams.get('checkOut') || tomorrowStr;
  const initialGuests = parseInt(searchParams.get('guests') || '2', 10);

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: roomTypes, isLoading } = useQuery({
    queryKey: ['available-rooms', checkIn, checkOut, guests],
    queryFn: () => fetchRoomTypes(),
  });

  const handleSelectRoom = (room: RoomType) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Breadcrumb / Back */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-hotel-gold transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Hotel Overview</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
          Real-Time Inventory
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-3">
          Available Suites & Residencies
        </h1>
        <p className="text-gray-400 text-sm font-light max-w-2xl">
          Reserve your preferred suite with guaranteed date locking. All reservations include fiber Wi-Fi, turndown service, and pool access.
        </p>
      </div>

      {/* Filter / Dates Bar */}
      <div className="bg-[#0F1626] border border-white/10 rounded-2xl p-4 sm:p-5 mb-12 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Check-In
            </label>
            <input
              type="date"
              value={checkIn}
              min={todayStr}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark]"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Check-Out
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || todayStr}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark]"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Occupancy
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10))}
              className="w-full bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
            >
              <option value="1" className="bg-[#0F1626] text-white">1 Guest</option>
              <option value="2" className="bg-[#0F1626] text-white">2 Guests</option>
              <option value="3" className="bg-[#0F1626] text-white">3 Guests</option>
              <option value="4" className="bg-[#0F1626] text-white">4+ Guests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suites Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-hotel-gold">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roomTypes?.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelectRoom={handleSelectRoom}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
      />
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#080C15] text-hotel-gold">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <RoomsContent />
    </Suspense>
  );
}
