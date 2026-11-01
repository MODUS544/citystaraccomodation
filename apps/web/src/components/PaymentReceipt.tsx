'use client';

import React from 'react';
import Image from 'next/image';
import { Printer, Download, Check, X, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

export interface PaymentReceiptData {
  receiptNo: string;
  date?: string;
  guestName: string;
  roomNo?: string | number;
  roomName?: string;
  nights: number;
  roomRate: number;
  accommodationTotal?: number;
  restaurantCharges?: number;
  serviceCharge?: number;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'SETTLED' | 'CONFIRMED' | string;
  watermarkNote?: string;
  logoUrl?: string;
}

interface PaymentReceiptProps {
  receipt: PaymentReceiptData;
  onClose?: () => void;
  showActions?: boolean;
}

export function PaymentReceipt({
  receipt,
  onClose,
  showActions = true,
}: PaymentReceiptProps) {
  const nights = receipt.nights || 1;
  const roomRate = receipt.roomRate || 0;
  const accommodationTotal = receipt.accommodationTotal ?? (roomRate * nights);
  const restaurantCharges = receipt.restaurantCharges || 0;
  const totalAmount = receipt.totalAmount || (accommodationTotal + restaurantCharges);
  const amountPaid = receipt.amountPaid ?? totalAmount;
  const balanceDue = receipt.balanceDue ?? Math.max(0, totalAmount - amountPaid);

  const displayDate = receipt.date
    ? formatDate(receipt.date)
    : new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const formattedPaymentMethod = receipt.paymentMethod
    ? receipt.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Bank Transfer';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Printable Receipt Paper Container */}
      <div
        id="printable-payment-receipt"
        className="bg-white text-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200/90 font-sans relative overflow-hidden transition-all text-left max-w-[440px] mx-auto"
      >
        {/* 1. Header with Centered Logo */}
        <div className="flex flex-col items-center text-center space-y-1 mb-5 pt-1">
          {/* Official City Star Logo Badge */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#1C1E24] border border-gray-200/40 flex items-center justify-center p-1.5 mb-2 shadow-lg relative overflow-hidden">
            <Image
              src={receipt.logoUrl || '/city-star-receipt-logo.jpg'}
              alt="City Star Hotel Logo"
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </div>

          {/* Hotel Name & Location */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 uppercase mt-1">
            CITY STAR HOTEL
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal">
            Maiduguri, Borno State, Nigeria
          </p>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#135846] pt-0.5">
            RESERVATION SLIP
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-4" />

        {/* 2. Key-Value Metadata Grid */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Booking Reference</span>
            <span className="font-bold text-[#135846] font-mono tracking-wider text-base">
              {receipt.receiptNo}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-900 font-normal">{displayDate}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Guest Name</span>
            <span className="font-bold text-gray-950">{receipt.guestName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Stay</span>
            <span className="text-gray-900 font-medium">
              {nights} night{nights > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-4" />

        {/* 3. Itemized Charges Table */}
        <div>
          {/* Table Header */}
          <div className="flex justify-between text-sm font-bold text-gray-950 pb-2.5">
            <span>Description</span>
            <span className="text-right">Amount</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100 text-sm">
            {/* Room accommodation row */}
            <div className="py-2.5 flex justify-between items-start gap-4">
              <div>
                <span className="text-gray-900 font-normal block leading-tight">
                  {receipt.roomName ? `${receipt.roomName} (${nights} × ${formatCurrency(roomRate)})` : `Room accommodation (${nights} × ${formatCurrency(roomRate)})`}
                </span>
              </div>
              <span className="font-normal text-gray-950 text-right whitespace-nowrap">
                {formatCurrency(accommodationTotal)}
              </span>
            </div>
          </div>

          {/* Total Breakdown */}
          <div className="border-t border-gray-200 mt-2 pt-3 space-y-2 text-sm">
            <div className="flex justify-between items-center font-bold text-black text-base">
              <span>Total</span>
              <span className="font-serif text-lg text-[#135846]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* 4. Confirmation & Payment Notice */}
        <div className="mt-5 pt-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Reservation Confirmed</span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Kindly check your email to confirm your booking reference.
          </p>

          <p className="text-xs text-gray-800 leading-relaxed font-medium bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl">
            Please complete your payment via the official <strong>City Star Mobile App</strong> on the <strong>Apple App Store</strong> or <strong>Google Play Store</strong>.
          </p>
        </div>
      </div>

      {/* Screen-Only Action Buttons */}
      {showActions && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Printer className="w-4 h-4 text-hotel-gold" />
            <span>Print Reservation Slip</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              Done / Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
