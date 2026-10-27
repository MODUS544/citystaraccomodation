'use client';

import React, { useState } from 'react';
import { Search, Calendar, Bed, User, MapPin, CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { fetchBookingByReference } from '../../lib/api';
import { Booking } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PaymentReceipt } from '../../components/PaymentReceipt';

export default function MyBookingsPage() {
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await fetchBookingByReference(reference.trim().toUpperCase());
      setBooking(data);
    } catch {
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
          Guest Portal
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-3">
          Manage Your Reservation
        </h1>
        <p className="text-gray-400 text-sm font-light max-w-md mx-auto">
          Enter your unique booking reference number (e.g. CH.MAVBU) to view reservation details.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-[#0F1626] border border-white/10 rounded-2xl p-4 sm:p-6 mb-10 shadow-xl">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Booking Reference (e.g. CH.MAVBU)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 font-mono uppercase focus:outline-none focus:border-hotel-gold"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Reservation'}
          </button>
        </form>
      </div>

      {/* Results Display */}
      {hasSearched && (
        <div>
          {booking ? (
            <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Booking Reference
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-hotel-gold">
                    {booking.booking_reference}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    booking.status === 'confirmed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : booking.status === 'checked_in'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : booking.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : booking.status === 'checked_out'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{booking.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Bed className="w-5 h-5 text-hotel-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-400">Reserved Suite</div>
                      <div className="text-white font-medium text-base">
                        {booking.room_type_name || 'Deluxe King Suite'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Room {booking.room_number || '101'} • Floor {booking.floor || '1'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-hotel-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-400">Duration of Stay</div>
                      <div className="text-white font-medium text-base">
                        {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.total_nights} Night{booking.total_nights > 1 ? 's' : ''} Stay
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-hotel-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-400">Primary Guest</div>
                      <div className="text-white font-medium text-base">
                        {booking.guest_name || 'Verified Resident'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.guest_email || 'Contact on file'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-hotel-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-400">Hotel Location</div>
                      <div className="text-white font-medium text-sm">
                        City Star Hotel, 450 Grand Star Boulevard
                      </div>
                      <div className="text-xs text-gray-500">
                        Check-in begins at 3:00 PM • Check-out by 11:00 AM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400">Total Billed</div>
                  <div className="font-serif text-2xl font-bold text-hotel-gold">
                    {formatCurrency(booking.total_amount)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  className="px-5 py-2.5 rounded-xl bg-hotel-gold hover:bg-hotel-gold-hover text-hotel-dark font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Official Receipt</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-[#0F1626] border border-white/10 rounded-3xl p-8">
              <AlertCircle className="w-10 h-10 text-hotel-gold mx-auto mb-3 opacity-60" />
              <h3 className="font-serif text-xl font-bold text-white mb-1">
                No Reservation Found
              </h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                We could not locate a reservation matching &ldquo;{reference}&rdquo;. Please verify your booking reference and try again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {showReceipt && booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="my-8 max-w-md w-full">
            <PaymentReceipt
              receipt={{
                receiptNo: booking.booking_reference,
                date: booking.check_in_date,
                guestName: booking.guest_name || 'Verified Resident',
                roomNo: booking.room_number || '204',
                roomName: booking.room_type_name || 'Deluxe Room',
                nights: booking.total_nights || 1,
                roomRate: Math.round(Number(booking.total_amount) / (booking.total_nights || 1)),
                accommodationTotal: Number(booking.total_amount),
                restaurantCharges: 0,
                totalAmount: Number(booking.total_amount),
                amountPaid: Number(booking.total_amount),
                balanceDue: 0,
                paymentMethod: booking.payment_method || 'Bank transfer',
                paymentStatus: booking.status === 'cancelled' ? 'PENDING' : 'PAID',
              }}
              onClose={() => setShowReceipt(false)}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
