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
  amountPaid: number;
  balanceDue?: number;
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'SETTLED';
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
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 pt-0.5">
            GUEST PAYMENT RECEIPT
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-4" />

        {/* 2. Key-Value Metadata Grid */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Receipt No.</span>
            <span className="font-bold text-gray-950 tracking-tight">
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
            <span className="text-gray-500">Room No.</span>
            <span className="text-gray-900 font-normal">
              {receipt.roomNo || '204'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Stay</span>
            <span className="text-gray-900 font-normal">
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
                  Room accommodation ({nights} × {formatCurrency(roomRate)})
                </span>
                {receipt.roomName && (
                  <span className="text-xs text-gray-500 block mt-0.5">
                    {receipt.roomName}
                  </span>
                )}
              </div>
              <span className="font-normal text-gray-950 text-right whitespace-nowrap">
                {formatCurrency(accommodationTotal)}
              </span>
            </div>

            {/* Restaurant charges row */}
            {restaurantCharges > 0 && (
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-gray-900 font-normal">Restaurant charges</span>
                <span className="font-normal text-gray-950 text-right">
                  {formatCurrency(restaurantCharges)}
                </span>
              </div>
            )}
          </div>

          {/* Total Breakdown */}
          <div className="border-t border-gray-200 mt-2 pt-3 space-y-2 text-sm">
            <div className="flex justify-between items-center font-bold text-black text-base">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-900">
              <span>Amount paid</span>
              <span className="font-normal text-black">
                {formatCurrency(amountPaid)}
              </span>
            </div>

            <div className="flex justify-between items-center text-gray-900">
              <span>Balance due</span>
              <span className="font-normal text-black">
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Payment Status Section */}
        <div className="mt-5 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#16A34A] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[3]" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base text-black">
                Payment status: {receipt.paymentStatus || 'PAID'}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Payment method: {formattedPaymentMethod}
              </div>
            </div>
          </div>

          {/* Footnote watermark */}
          <div className="text-center text-[10px] tracking-wider uppercase text-gray-400 mt-6 pt-3 border-t border-dashed border-gray-200 font-medium">
            {receipt.watermarkNote || 'OFFICIAL PAYMENT RECEIPT — CITY STAR HOTEL MAIDUGURI'}
          </div>
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
            <span>Print Receipt</span>
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
