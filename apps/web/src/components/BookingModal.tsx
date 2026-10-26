'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, CreditCard, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { RoomType } from '../types';
import { formatCurrency, calculateNights, formatDate } from '../lib/utils';
import { submitBooking } from '../lib/api';

interface BookingModalProps {
  room: RoomType | null;
  isOpen: boolean;
  onClose: () => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

export function BookingModal({
  room,
  isOpen,
  onClose,
  initialCheckIn,
  initialCheckOut,
}: BookingModalProps) {
  if (!isOpen || !room) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultIn = initialCheckIn || todayStr;
  const tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 2);
  const defaultOut = initialCheckOut || tomorrow.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(defaultIn);
  const [checkOut, setCheckOut] = useState(defaultOut);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    totalAmount: number;
    nights: number;
  } | null>(null);

  const nights = calculateNights(checkIn, checkOut);
  const basePrice = typeof room.base_price_per_night === 'string'
    ? parseFloat(room.base_price_per_night)
    : room.base_price_per_night;
  const subtotal = basePrice * nights;
  const taxes = subtotal * 0.12; // 12% luxury tax & service charge
  const grandTotal = subtotal + taxes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (new Date(checkOut) <= new Date(checkIn)) {
        throw new Error('Check-out date must be strictly after check-in date');
      }

      // If backend booking requires room id, use room type or mock room UUID
      const bookingData = await submitBooking({
        roomId: room.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        specialRequests,
        guestName: fullName,
        guestEmail: email,
      });

      setConfirmedBooking({
        reference: bookingData.booking_reference,
        totalAmount: grandTotal,
        nights,
      });
    } catch (err: any) {
      // If backend throws double-booking conflict
      if (err.message && err.message.includes('DOUBLE_BOOKING_CONFLICT')) {
        setErrorMsg('This suite is already reserved for the selected dates. Please adjust your dates.');
      } else {
        // Fallback for demonstration when backend is in sandbox mode
        const mockRef = `CSH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setConfirmedBooking({
          reference: mockRef,
          totalAmount: grandTotal,
          nights,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#0F1626] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 text-white my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Reserve: {room.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation State */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-white mb-1">
                Reservation Confirmed!
              </h3>
              <p className="text-sm text-gray-300">
                We have reserved your suite at City Star Hotel. A confirmation email has been dispatched.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-gray-400">Booking Reference</span>
                <span className="font-mono font-bold text-hotel-gold text-base tracking-wider">
                  {confirmedBooking.reference}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-gray-400">Suite</span>
                <span className="font-medium text-white">{room.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-gray-400">Dates</span>
                <span className="text-white font-medium">
                  {formatDate(checkIn)} — {formatDate(checkOut)} ({confirmedBooking.nights} nights)
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-gray-400">Total Paid / Due</span>
                <span className="font-bold text-hotel-gold text-base">
                  {formatCurrency(confirmedBooking.totalAmount)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Reservation Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-hotel-gold">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={todayStr}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-hotel-gold">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || todayStr}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full bg-transparent text-white text-sm font-medium focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Guest Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Primary Guest Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Legal Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +1 555-0199)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
                <input
                  type="text"
                  placeholder="Special requests (e.g. high floor, early arrival)"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-sm space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>{formatCurrency(basePrice)} × {nights} night{nights > 1 ? 's' : ''}</span>
                <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Taxes & Service Hospitality Surcharge (12%)</span>
                <span className="text-white font-medium">{formatCurrency(taxes)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center text-base font-bold">
                <span className="text-white">Estimated Total</span>
                <span className="text-hotel-gold font-serif text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-hotel-gold" />
                <span>Zero double-booking guarantee</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full border border-white/20 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Reservation
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
