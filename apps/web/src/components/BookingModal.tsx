'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Smartphone,
  Mail,
  Download,
  Star,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  // Confirmed booking state (Customer Mobile App Payment modal)
  const [reservedBooking, setReservedBooking] = useState<{
    bookingCode: string;
    totalAmount: number;
    nights: number;
    guestName: string;
    guestEmail: string;
    roomName: string;
    checkIn: string;
    checkOut: string;
  } | null>(null);

  const nights = calculateNights(checkIn, checkOut);
  const basePrice = typeof room.base_price_per_night === 'string'
    ? parseFloat(room.base_price_per_night)
    : room.base_price_per_night;
  const grandTotal = basePrice * nights;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (new Date(checkOut) <= new Date(checkIn)) {
        throw new Error('Check-out date must be strictly after check-in date');
      }

      // Submit reservation to API
      const bookingData = await submitBooking({
        roomId: room.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        specialRequests,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
      });

      // Extract generated booking code (e.g. CS-MAID-98421)
      const bookingCode =
        bookingData.booking_reference?.startsWith('CS-MAID-')
          ? bookingData.booking_reference
          : (bookingData as any).booking_code ||
            `CS-MAID-${Math.floor(10000 + Math.random() * 90000)}`;

      setReservedBooking({
        bookingCode,
        totalAmount: grandTotal,
        nights,
        guestName: fullName || 'Valued Guest',
        guestEmail: email || 'guest@citystarhotel.com',
        roomName: room.name,
        checkIn,
        checkOut,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('DOUBLE_BOOKING_CONFLICT')) {
        setErrorMsg('This suite is already reserved for the selected dates. Please adjust your dates.');
      } else {
        setErrorMsg(err.message || 'Failed to complete reservation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (reservedBooking?.bookingCode) {
      navigator.clipboard.writeText(reservedBooking.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
      <div className="relative w-full max-w-xl bg-[#0F1626] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 text-white my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-hotel-gold fill-hotel-gold" />
            <span>{reservedBooking ? 'Reservation Initiated' : `Reserve: ${room.name}`}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {reservedBooking ? (
          /* ============================================================== */
          /* CUSTOMER CONFIRMATION MODAL: DOWNLOAD MOBILE APP TO PAY       */
          /* ============================================================== */
          <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto text-left">
            {/* Status Pill */}
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Suite Locked • Pending Mobile App Payment</span>
              </span>
              <h3 className="font-serif text-2xl font-bold text-white">
                Reservation Confirmed!
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm font-light max-w-md mx-auto">
                Your suite has been tentatively reserved. Complete payment on the official mobile app to finalize your check-in.
              </p>
            </div>

            {/* Unique Booking Reference Code Highlight Card */}
            <div className="bg-gradient-to-br from-[#135846]/20 to-hotel-gold/10 border border-hotel-gold/40 rounded-2xl p-5 text-center space-y-2 relative overflow-hidden">
              <div className="text-[11px] uppercase tracking-wider text-hotel-gold font-bold">
                Your Unique Booking Reference Code
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest selection:bg-hotel-gold">
                {reservedBooking.bookingCode}
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hotel-gold/20 hover:bg-hotel-gold/30 border border-hotel-gold/50 text-hotel-gold text-xs font-semibold transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Booking Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center flex-shrink-0 text-hotel-gold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    Download City Star App to Complete Payment
                  </h4>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    Direct website payments are disabled for security. Open the <strong>City Star Mobile App</strong>, enter your Booking Code <span className="font-mono text-hotel-gold">{reservedBooking.bookingCode}</span>, and complete your payment via secure bank transfer, debit card, or USSD.
                  </p>
                </div>
              </div>

              {/* Mobile App Store Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="#app-store"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Redirecting to City Star iOS App on Apple App Store...');
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors group"
                >
                  <Download className="w-4 h-4 text-hotel-gold group-hover:translate-y-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">Download on the</div>
                    <div className="font-semibold text-xs text-white">Apple App Store</div>
                  </div>
                </a>

                <a
                  href="#google-play"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Redirecting to City Star Android App on Google Play Store...');
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-colors group"
                >
                  <Download className="w-4 h-4 text-hotel-gold group-hover:translate-y-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">Get it on</div>
                    <div className="font-semibold text-xs text-white">Google Play Store</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Reservation Summary */}
            <div className="border border-white/10 rounded-2xl p-4 bg-black/20 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Reserved Suite</span>
                <span className="font-semibold text-white">{reservedBooking.roomName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Stay Schedule</span>
                <span className="text-white">
                  {formatDate(reservedBooking.checkIn)} — {formatDate(reservedBooking.checkOut)} ({reservedBooking.nights} Nights)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Guest Name</span>
                <span className="text-white">{reservedBooking.guestName}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-400 font-semibold">Total Amount Due</span>
                <span className="font-serif text-base font-bold text-hotel-gold">
                  {formatCurrency(reservedBooking.totalAmount)}
                </span>
              </div>
            </div>

            {/* Email Dispatch Notice */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
              <Mail className="w-4 h-4 text-hotel-gold flex-shrink-0" />
              <span>
                Confirmation email with your booking summary and app download links has been dispatched to <strong>{reservedBooking.guestEmail}</strong>.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/my-bookings"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-center text-white transition-all"
              >
                View My Bookings
              </Link>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-hotel-gold text-hotel-dark font-bold text-xs uppercase tracking-wider hover:bg-hotel-gold/90 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* RESERVATION FORM                                              */
          /* ============================================================== */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 text-left">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dates Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Check-In
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={todayStr}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold [color-scheme:dark]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || todayStr}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Guest Info */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-gray-300 font-medium">
                  Primary Guest Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alhaji Mustapha Mai"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-300 font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-300 font-medium">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 803 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-gray-300 font-medium">
                  Special Requests / VIP Dietary Directives
                </label>
                <textarea
                  rows={2}
                  placeholder="Airport transfer from Maiduguri Airport, late check-in, extra pillows..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Nightly Rate:</span>
                <span className="text-white">{formatCurrency(basePrice)} / night</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Duration:</span>
                <span className="text-white">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                <span className="text-white uppercase tracking-wider">Total Reservation Fee:</span>
                <span className="font-serif text-base text-hotel-gold">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-hotel-gold flex-shrink-0" />
              <span>
                Payment is completed via the City Star Mobile App using your unique Booking Reference Code.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Reservation & Generating Code...</span>
                </>
              ) : (
                <>
                  <span>Reserve Suite ({formatCurrency(grandTotal)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
