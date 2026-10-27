'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Search,
  KeyRound,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  BedDouble,
  ShieldCheck,
  RefreshCw,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import {
  fetchRoomTypes,
  fetchAvailableRoomsForWalkIn,
  lookupWalkInGuest,
  createWalkInBooking,
} from '../../../../lib/api';
import {
  RoomType,
  AvailableWalkInRoom,
  WalkInGuest,
  WalkInBookingPayload,
} from '../../../../types';
import { PaymentReceipt } from '../../../../components/PaymentReceipt';

export default function WalkInPage() {
  const queryClient = useQueryClient();

  // Sensible default dates (today to tomorrow)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  const [returningGuestFound, setReturningGuestFound] = useState<WalkInGuest | null>(null);

  // KYC Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idDocumentType, setIdDocumentType] = useState<
    'nin' | 'national_id' | 'passport' | 'drivers_license' | 'voters_card'
  >('nin');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Stay State
  const [checkInDate, setCheckInDate] = useState(formatDate(today));
  const [checkOutDate, setCheckOutDate] = useState(formatDate(tomorrow));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Payment & Key Handover State
  const [paymentMethod, setPaymentMethod] = useState<'pos_terminal' | 'cash' | 'transfer' | 'card_online'>('pos_terminal');
  const [paymentReference, setPaymentReference] = useState('');
  const [autoCheckIn, setAutoCheckIn] = useState(true);
  const [specialRequests, setSpecialRequests] = useState('');

  // Confirmation Modal State
  const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Room Categories
  const { data: roomTypes, isLoading: isLoadingRoomTypes } = useQuery({
    queryKey: ['room-types'],
    queryFn: fetchRoomTypes,
  });

  // Default first room type once loaded
  useEffect(() => {
    if (Array.isArray(roomTypes) && roomTypes.length > 0 && !selectedRoomTypeId) {
      setSelectedRoomTypeId(roomTypes[0].id);
    }
  }, [roomTypes, selectedRoomTypeId]);

  // Fetch Available Physical Rooms for selected type & dates
  const {
    data: availableRooms = [],
    isLoading: isLoadingRooms,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ['walk-in-available-rooms', selectedRoomTypeId, checkInDate, checkOutDate],
    queryFn: () =>
      fetchAvailableRoomsForWalkIn(selectedRoomTypeId, checkInDate, checkOutDate),
    enabled: Boolean(selectedRoomTypeId && checkInDate && checkOutDate),
  });

  // Auto-select first available physical room when list changes
  useEffect(() => {
    if (Array.isArray(availableRooms) && availableRooms.length > 0) {
      const isCurrentSelectedStillAvailable = availableRooms.some(
        (r) => (r.id || r.room_id) === selectedRoomId
      );
      if (!isCurrentSelectedStillAvailable) {
        setSelectedRoomId(availableRooms[0].id || availableRooms[0].room_id || '');
      }
    } else {
      setSelectedRoomId('');
    }
  }, [availableRooms, selectedRoomId]);

  // Calculate Nights & Cost
  const selectedRoomType = Array.isArray(roomTypes)
    ? roomTypes.find((r) => r.id === selectedRoomTypeId)
    : undefined;
  const calculateNights = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };
  const totalNights = calculateNights();
  const roomRate = selectedRoomType
    ? Number(selectedRoomType.base_price_per_night || selectedRoomType.basePrice || 0)
    : 0;
  const totalPrice = roomRate * totalNights;

  // Handle Guest Lookup
  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearchingGuest(true);
      setFormError(null);
      const guest = await lookupWalkInGuest(searchQuery.trim());
      if (guest) {
        setReturningGuestFound(guest);
        setFullName(guest.fullName || '');
        setPhoneNumber(guest.phoneNumber || '');
        setEmail(guest.email || '');
        if (guest.dateOfBirth) setDateOfBirth(guest.dateOfBirth.split('T')[0]);
        if (guest.idDocumentType) setIdDocumentType(guest.idDocumentType as any);
        setIdNumber(guest.idNumber || '');
        setAddress(guest.address || '');
        setEmergencyContactName(guest.emergencyContactName || '');
        setEmergencyContactPhone(guest.emergencyContactPhone || '');
      } else {
        setReturningGuestFound(null);
        alert('No existing profile matched this query. Proceed to register as a new guest.');
      }
    } catch (err: any) {
      console.warn('Guest lookup note:', err);
      setReturningGuestFound(null);
    } finally {
      setIsSearchingGuest(false);
    }
  };

  // Booking Mutation
  const walkInMutation = useMutation({
    mutationFn: (payload: WalkInBookingPayload) => createWalkInBooking(payload),
    onSuccess: (data) => {
      setBookingSuccessData(data);
      queryClient.invalidateQueries({ queryKey: ['walk-in-available-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setFormError(null);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to process walk-in registration. Please verify room availability.';
      setFormError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!fullName.trim()) {
      setFormError('Guest full name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('Guest phone number is required.');
      return;
    }
    if (!idNumber.trim()) {
      setFormError('Government identification number is mandatory for KYC compliance.');
      return;
    }
    if (!address.trim()) {
      setFormError('Guest residential address is required.');
      return;
    }
    if (!selectedRoomTypeId) {
      setFormError('Please select a room category.');
      return;
    }

    const payload: WalkInBookingPayload = {
      guest: {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        idDocumentType,
        idNumber: idNumber.trim(),
        address: address.trim(),
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      },
      booking: {
        roomTypeId: selectedRoomTypeId,
        roomId: selectedRoomId || undefined,
        checkInDate,
        checkOutDate,
        adults: Number(adults),
        children: Number(children),
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        autoCheckIn,
        specialRequests: specialRequests.trim() || undefined,
      },
    };

    walkInMutation.mutate(payload);
  };

  const resetForm = () => {
    setBookingSuccessData(null);
    setReturningGuestFound(null);
    setSearchQuery('');
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setDateOfBirth('');
    setIdNumber('');
    setAddress('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setPaymentReference('');
    setSpecialRequests('');
    setAutoCheckIn(true);
    refetchRooms();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Front Desk Operations Terminal
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Walk-In Guest Registration & Key Handover
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Mandatory KYC compliance, atomic physical room locking, POS settlement, and immediate digital check-in.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-gray-300">
            <ShieldCheck className="w-4 h-4 text-hotel-gold" />
            <span>KYC Security Enforced</span>
          </div>
        </div>
      </div>

      {/* Guest Fast Lookup Toolbar */}
      <div className="bg-[#0A101D] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg">
        <form onSubmit={handleGuestLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-hotel-gold flex-shrink-0">
            <Search className="w-4 h-4 text-hotel-gold" />
            <span>Returning Guest Lookup:</span>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone number or ID number (e.g. +234... or NIN)..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSearchingGuest}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors border border-white/10"
          >
            {isSearchingGuest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup Guest</span>
          </button>
        </form>

        {returningGuestFound && (
          <div className="mt-3 p-3 rounded-xl bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-between text-xs text-hotel-gold">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-hotel-gold" />
              <span>
                <strong>Returning Guest Verified:</strong> {returningGuestFound.fullName} ({returningGuestFound.phoneNumber})
              </span>
            </div>
            <button
              onClick={() => {
                setReturningGuestFound(null);
                resetForm();
              }}
              className="text-[11px] underline hover:text-white"
            >
              Clear & Register New Guest
            </button>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3 text-xs sm:text-sm animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: KYC Profile & Stay Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Guest KYC Profile */}
          <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-hotel-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Section 1: Guest KYC Identity</h3>
                  <p className="text-xs text-gray-400">Official government record required for all hospitality guests.</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                Mandatory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Vance"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexander@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            {/* Document Verification Row */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  ID Document Type *
                </label>
                <select
                  value={idDocumentType}
                  onChange={(e) => setIdDocumentType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080C15] border border-white/10 text-xs text-white focus:outline-none focus:border-hotel-gold"
                >
                  <option value="nin">National Identification Number (NIN)</option>
                  <option value="national_id">National Identity Card</option>
                  <option value="passport">International Passport</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                  <option value="voters_card">Voter&apos;s Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  ID Document Number *
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter document reference number"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                Residential Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City, State"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
            </div>

            {/* Emergency Contact */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Emergency Contact Name</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Next of kin / Emergency contact"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Emergency telephone"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Room Category & Physical Room Allocation */}
          <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center">
                  <BedDouble className="w-4 h-4 text-hotel-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Section 2: Stay Dates & Room Selection</h3>
                  <p className="text-xs text-gray-400">Atomic locking guarantees zero double-booking conflicts.</p>
                </div>
              </div>
            </div>

            {/* Dates & Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-hotel-gold" />
                  Check-In Date *
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-hotel-gold" />
                  Check-Out Date *
                </label>
                <input
                  type="date"
                  required
                  min={checkInDate}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Adults</label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#080C15] border border-white/10 text-xs text-white focus:outline-none focus:border-hotel-gold"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Children</label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#080C15] border border-white/10 text-xs text-white focus:outline-none focus:border-hotel-gold"
                >
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                </select>
              </div>
            </div>

            {/* Room Categories Selector */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                Select Suite Category *
              </label>
              {isLoadingRoomTypes ? (
                <div className="py-4 text-xs text-gray-500 animate-pulse">Loading room categories...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Array.isArray(roomTypes) && roomTypes.map((rt) => {
                    const isSelected = selectedRoomTypeId === rt.id;
                    return (
                      <div
                        key={rt.id}
                        onClick={() => setSelectedRoomTypeId(rt.id)}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all text-left ${
                          isSelected
                            ? 'bg-hotel-gold/15 border-hotel-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-bold text-white mb-1">{rt.name}</div>
                        <div className="text-[11px] text-hotel-gold font-semibold">
                          ${Number(rt.base_price_per_night || rt.basePrice || 0)}{' '}
                          <span className="text-[9px] text-gray-400">/ night</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Up to {rt.max_occupancy || rt.maxGuests || 2} guests
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Physical Available Rooms Chips */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                  Physical Room Allocation (Ready & Inspected)
                </label>
                <span className="text-[11px] text-gray-400">
                  {isLoadingRooms
                    ? 'Scanning available inventory...'
                    : `${Array.isArray(availableRooms) ? availableRooms.length : 0} room(s) available`}
                </span>
              </div>

              {isLoadingRooms ? (
                <div className="py-3 text-xs text-gray-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-hotel-gold" />
                  <span>Checking room inventory for date range...</span>
                </div>
              ) : !Array.isArray(availableRooms) || availableRooms.length === 0 ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  No physical rooms in this category are available for the selected dates. Please choose another suite category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableRooms.map((r) => {
                    const roomId = r.id || r.room_id || '';
                    const isSelected = selectedRoomId === roomId;
                    return (
                      <button
                        type="button"
                        key={roomId}
                        onClick={() => setSelectedRoomId(roomId)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs">Room {r.room_number || r.roomNumber}</div>
                        <div className="text-[10px] text-gray-400">Floor {r.floor} • Ready</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Pricing Summary, Payment & Check-In */}
        <div className="space-y-6">
          <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl sticky top-8">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <div className="w-8 h-8 rounded-lg bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-hotel-gold" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Section 3: Folio & Payment</h3>
                <p className="text-xs text-gray-400">Rate computation & key issue</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span>Suite Category:</span>
                <span className="text-white font-medium">{selectedRoomType?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Rate per Night:</span>
                <span className="text-white font-medium">
                  ${Number(selectedRoomType?.base_price_per_night || selectedRoomType?.basePrice || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Duration:</span>
                <span className="text-white font-medium">{totalNights} Night(s)</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                <span className="font-bold text-white">Total Amount Due:</span>
                <span className="font-serif text-lg font-bold text-hotel-gold">${totalPrice}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                Payment Tender Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#080C15] border border-white/10 text-xs text-white focus:outline-none focus:border-hotel-gold"
              >
                <option value="pos_terminal">POS Terminal / Card Swipe</option>
                <option value="cash">Front Desk Cash</option>
                <option value="transfer">Bank Wire / Instant Transfer</option>
                <option value="card_online">Online Payment Card</option>
              </select>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Payment Reference / POS Slip #
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. POS-STANBIC-98124"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            {/* Instant Key Handover Toggle */}
            <div className="p-4 rounded-2xl bg-hotel-gold/10 border border-hotel-gold/30 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCheckIn}
                  onChange={(e) => setAutoCheckIn(e.target.checked)}
                  className="mt-0.5 rounded border-hotel-gold text-hotel-gold focus:ring-hotel-gold"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-hotel-gold" />
                    <span>Issue Physical Key & Check-In Immediately</span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Sets booking status to &apos;checked_in&apos; and activates the room key card slip.
                  </p>
                </div>
              </label>
            </div>

            {/* Front Desk Notes */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Front Desk Notes (Optional)</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="VIP guest preferences, extra towels, late check-out requested..."
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={walkInMutation.isPending || !Array.isArray(availableRooms) || availableRooms.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-hotel-gold via-[#C5A038] to-[#AA820A] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {walkInMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Walk-In...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Confirm Walk-In & Handover Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation & Official Payment Receipt Modal */}
      {bookingSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="my-8 max-w-md w-full">
            <PaymentReceipt
              receipt={{
                receiptNo: bookingSuccessData.bookingReference || 'CSH-000125',
                guestName: fullName || 'Abdullahi Musa',
                roomNo: bookingSuccessData.roomNumber || '204',
                roomName: selectedRoomType?.name || 'Deluxe Room',
                nights: totalNights,
                roomRate: roomRate,
                accommodationTotal: totalPrice,
                restaurantCharges: 0,
                totalAmount: totalPrice,
                amountPaid: totalPrice,
                balanceDue: 0,
                paymentMethod: paymentMethod,
                paymentStatus: 'PAID',
              }}
              onClose={resetForm}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
