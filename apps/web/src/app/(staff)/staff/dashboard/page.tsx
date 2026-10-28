'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck2,
  Search,
  LogIn,
  LogOut,
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Printer,
  X,
  Clock,
  Check,
  User,
  Phone,
  Mail,
  DoorOpen,
  Bed,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  fetchAdminBookings,
  fetchAdminOverview,
  updateBookingStatus,
  markBookingPaidAtDesk,
  AdminActionBooking,
} from '../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import { PaymentReceipt } from '../../../../components/PaymentReceipt';

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Folio / Modal states
  const [selectedFolio, setSelectedFolio] = useState<AdminActionBooking | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<AdminActionBooking | null>(null);

  // 1. Dashboard Overview KPI Metrics
  const {
    data: overview,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
    isFetching: isFetchingOverview,
  } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetchAdminOverview(),
  });

  // 2. Real-time Bookings & Queue Data
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staff-bookings', page, status, search],
    queryFn: () =>
      fetchAdminBookings({
        page,
        limit: 25,
        status: status === 'all' ? undefined : (status as any),
        search: search.trim() || undefined,
      }),
  });

  const handleRefreshAll = () => {
    refetch();
    refetchOverview();
  };

  const statusMutation = useMutation({
    mutationFn: ({
      bookingId,
      newStatus,
    }: {
      bookingId: string;
      newStatus: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
    }) => updateBookingStatus(bookingId, newStatus),
    onSuccess: (_, variables) => {
      const msg =
        variables.newStatus === 'checked_in'
          ? 'Guest checked in successfully. Assigned room marked as Occupied.'
          : variables.newStatus === 'checked_out'
          ? 'Guest checked out. Room released to Available.'
          : 'Reservation status updated.';
      setNotification({ type: 'success', message: msg });
      queryClient.invalidateQueries({ queryKey: ['staff-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Action failed' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const payDeskMutation = useMutation({
    mutationFn: (bookingId: string) => markBookingPaidAtDesk(bookingId),
    onSuccess: () => {
      setNotification({
        type: 'success',
        message: 'Payment recorded as "Paid at Desk". Reservation marked Confirmed.',
      });
      queryClient.invalidateQueries({ queryKey: ['staff-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Payment update failed' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const bookings = data?.bookings || [];
  const pagination = data?.pagination;
  const isRefreshing = isFetching || isFetchingOverview;

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Page Title & Realtime Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#135846] font-bold block mb-1">
            Dashboard Overview
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538] tracking-tight">
            Hotel Operations & Front Desk Queue
          </h1>
          <p className="text-[#818E9B] text-xs sm:text-sm mt-0.5">
            Live occupancy metrics, VIP check-ins, counter payment recording, and room release management.
          </p>
        </div>

        <button
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEFF4] text-xs font-semibold text-[#556376] hover:text-[#1E2538] shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#135846]' : 'text-[#818E9B]'}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* 4-Card Dashboard Overview KPI Summary Banner (Travl Hospitality Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Live Occupancy */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              Live Occupancy
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] text-[#135846] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-[#1E2538] font-sans">
              {isLoadingOverview ? '...' : `${overview?.kpis?.occupancyRate || 0}%`}
            </span>
            <span className="text-xs text-[#818E9B] font-medium">
              ({overview?.kpis?.occupiedRooms || 0} / {overview?.kpis?.totalRooms || 0} Rooms)
            </span>
          </div>
          <div className="text-xs text-[#556376] flex items-center gap-2 mt-3 pt-3 border-t border-[#F4F6F9]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#135846] animate-pulse" />
            <span>
              <strong className="text-[#135846] font-semibold">{overview?.kpis?.availableRooms || 0}</strong> Available • {overview?.kpis?.maintenanceRooms || 0} Maint.
            </span>
          </div>
        </div>

        {/* KPI 2: Gross Revenue / Intake MTD */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              Revenue (MTD)
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#FFF8E6] text-[#D97706] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#135846] font-serif">
              {isLoadingOverview ? '...' : formatCurrency(overview?.kpis?.monthToDateRevenue || 0)}
            </span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center justify-between">
            <span className="text-[#818E9B]">YTD Total:</span>
            <strong className="text-[#1E2538] font-semibold">
              {formatCurrency(overview?.kpis?.yearToDateRevenue || 0)}
            </strong>
          </div>
        </div>

        {/* KPI 3: Today's Check-In */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              Today's Check-In
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#EBF4FF] text-[#1D4ED8] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <LogIn className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-[#1E2538] font-sans">
              {isLoadingOverview ? '...' : overview?.kpis?.checkInsToday || 0}
            </span>
            <span className="text-xs text-[#818E9B] font-medium">Arrivals Scheduled</span>
          </div>
          <div className="text-xs mt-3 pt-3 border-t border-[#F4F6F9] flex items-center gap-1.5">
            {(overview?.kpis?.pendingBookings || 0) > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#FE5757] animate-pulse" />
                <span className="text-[#FE5757] font-semibold">
                  {overview?.kpis?.pendingBookings} Pending Payment
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#135846]" />
                <span className="text-[#135846] font-medium">All Check-Ins Scheduled</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 4: Today's Check-Out */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              Today's Check-Out
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#FFEBEB] text-[#FE5757] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <LogOut className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-[#1E2538] font-sans">
              {isLoadingOverview ? '...' : overview?.kpis?.checkOutsToday || 0}
            </span>
            <span className="text-xs text-[#818E9B] font-medium">Departures Pending</span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#818E9B]" />
            <span>
              {overview?.kpis?.activeBookings || bookings.length} Total Bookings in System
            </span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-md ${
            notification.type === 'success'
              ? 'bg-[#E8F8F0] border border-[#135846]/20 text-[#135846]'
              : 'bg-[#FFEBEB] border border-[#FE5757]/20 text-[#FE5757]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#135846]" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FE5757]" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
        {/* Controls: Search & Underlined Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-[#818E9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Code (CS-MAID-...), Name, Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#F4F6F9] border border-[#EAEFF4] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1E2538] placeholder-[#818E9B] focus:outline-none focus:border-[#135846] transition-colors"
            />
          </div>

          <div className="text-xs text-[#818E9B]">
            Showing <strong className="text-[#1E2538] font-bold">{bookings.length}</strong> Reservations
          </div>
        </div>

        {/* Travl Underlined Tabs */}
        <div className="flex items-center gap-6 border-b border-[#EAEFF4] overflow-x-auto pb-px text-sm">
          {[
            { id: 'all', label: 'All Queue' },
            { id: 'pending', label: 'Pending Payment' },
            { id: 'confirmed', label: 'Confirmed (Paid)' },
            { id: 'checked_in', label: 'Checked In (Occupied)' },
            { id: 'checked_out', label: 'Checked Out' },
          ].map((tab) => {
            const isActive = status === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatus(tab.id);
                  setPage(1);
                }}
                className={`pb-3.5 font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-[#135846] border-b-2 border-[#135846]'
                    : 'text-[#818E9B] hover:text-[#1E2538]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Real-time Guest Queue Table */}
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full text-left text-sm text-[#556376]">
            <thead className="text-[11px] uppercase tracking-wider text-[#818E9B] bg-[#F9FAFC] border-y border-[#EAEFF4]">
              <tr>
                <th className="py-3.5 px-6 font-semibold">Booking Code & Guest</th>
                <th className="py-3.5 px-4 font-semibold">Suite & Floor</th>
                <th className="py-3.5 px-4 font-semibold">Stay Schedule</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount (₦)</th>
                <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                <th className="py-3.5 px-4 font-semibold">Queue Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF4]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#818E9B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#135846]" />
                      <span>Loading real-time queue...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#818E9B]">
                    No guest reservations found matching current criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b: AdminActionBooking) => {
                  const initials = (b.guest_name || 'Guest')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const isCheckedIn = b.status === 'checked_in';
                  const isCheckedOut = b.status === 'checked_out';
                  const isPending = b.status === 'pending';
                  const isConfirmed = b.status === 'confirmed';

                  const paymentStatus = (b as any).payment_status || 'unpaid';
                  const isPaid = paymentStatus === 'paid_via_app' || paymentStatus === 'paid_at_desk' || paymentStatus === 'completed';

                  return (
                    <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      {/* Booking Code & Guest */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#EBF4FF] text-[#1D4ED8] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-mono text-xs font-bold text-[#FE5757]">
                              {(b as any).booking_code || b.booking_reference}
                            </div>
                            <div className="font-semibold text-sm text-[#1E2538] group-hover:text-[#135846] transition-colors">
                              {b.guest_name}
                            </div>
                            <div className="text-[11px] text-[#818E9B]">{b.guest_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Suite */}
                      <td className="py-4 px-4">
                        <div className="text-[#1E2538] font-medium flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-[#F4F6F9] border border-[#EAEFF4] font-mono text-xs font-semibold text-[#1E2538]">
                            #{b.room_number}
                          </span>
                          <span>{b.room_type_name}</span>
                        </div>
                        <div className="text-xs text-[#818E9B] mt-0.5">Floor {b.floor}</div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 text-xs">
                        <div className="text-[#1E2538] font-medium">
                          {formatDate(b.check_in_date)} — {formatDate(b.check_out_date)}
                        </div>
                        <div className="text-[#818E9B] mt-0.5">{b.total_nights} Nights</div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 font-serif font-bold text-[#1E2538]">
                        {formatCurrency(b.total_amount)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            isPaid
                              ? 'bg-[#E8F8F0] text-[#135846]'
                              : 'bg-[#FFF8E6] text-[#D97706]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{paymentStatus.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Queue Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            isCheckedIn
                              ? 'bg-[#EBF4FF] text-[#1D4ED8]'
                              : isConfirmed
                              ? 'bg-[#E8F8F0] text-[#135846]'
                              : isPending
                              ? 'bg-[#FFF8E6] text-[#D97706]'
                              : isCheckedOut
                              ? 'bg-[#F1F3F6] text-[#556376]'
                              : 'bg-[#FFEBEB] text-[#FE5757]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{b.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Front Desk Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Active Folio / Notes */}
                          <button
                            onClick={() => setSelectedFolio(b)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F4F6F9] hover:bg-[#EAEFF4] text-[#556376] text-xs font-semibold transition-colors flex items-center gap-1"
                            title="View guest folio and special requests"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#135846]" />
                            <span>Folio</span>
                          </button>

                          {/* Mark Paid at Desk button */}
                          {!isPaid && !isCheckedOut && (
                            <button
                              onClick={() => payDeskMutation.mutate(b.id)}
                              disabled={payDeskMutation.isPending}
                              className="px-2.5 py-1.5 rounded-xl bg-[#FFF8E6] hover:bg-[#FFEEC2] text-[#D97706] text-xs font-semibold border border-[#D97706]/30 transition-all flex items-center gap-1"
                              title="Mark paid over counter via cash/POS"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Paid at Desk</span>
                            </button>
                          )}

                          {/* Check In */}
                          {(!isCheckedIn && !isCheckedOut && b.status !== 'cancelled') && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  bookingId: b.id,
                                  newStatus: 'checked_in',
                                })
                              }
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-[#135846] hover:bg-[#0e4335] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                          )}

                          {/* Check Out */}
                          {isCheckedIn && (
                            <button
                              onClick={() =>
                                statusMutation.mutate({
                                  bookingId: b.id,
                                  newStatus: 'checked_out',
                                })
                              }
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-[#FE5757] hover:bg-[#e04545] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Check Out</span>
                            </button>
                          )}

                          {/* Receipt for Paid reservations */}
                          {isPaid && (
                            <button
                              onClick={() => setPrintingReceipt(b)}
                              className="p-1.5 rounded-xl bg-[#F4F6F9] hover:bg-[#EAEFF4] text-[#135846]"
                              title="Print Official Desk Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Folio & Special Requests Modal */}
      {selectedFolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#EAEFF4] text-[#1E2538] space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-[#EAEFF4] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] text-[#135846] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1E2538]">
                    Guest Reservation Folio
                  </h3>
                  <span className="font-mono text-xs text-[#FE5757] font-semibold">
                    {(selectedFolio as any).booking_code || selectedFolio.booking_reference} • {selectedFolio.guest_name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFolio(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#EAEFF4]">
                <div>
                  <span className="text-[#818E9B] block">Assigned Suite</span>
                  <strong className="text-sm text-[#1E2538]">
                    Room #{selectedFolio.room_number} ({selectedFolio.room_type_name})
                  </strong>
                </div>
                <div>
                  <span className="text-[#818E9B] block">Total Amount</span>
                  <strong className="text-sm text-[#135846] font-serif">
                    {formatCurrency(selectedFolio.total_amount)}
                  </strong>
                </div>
                <div className="pt-2">
                  <span className="text-[#818E9B] block">Check-In Date</span>
                  <span className="text-[#1E2538] font-medium">{formatDate(selectedFolio.check_in_date)}</span>
                </div>
                <div className="pt-2">
                  <span className="text-[#818E9B] block">Check-Out Date</span>
                  <span className="text-[#1E2538] font-medium">{formatDate(selectedFolio.check_out_date)}</span>
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#818E9B] font-bold mb-1">
                  Special Requests / VIP Concierge Directives
                </label>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#EAEFF4] text-[#1E2538] text-sm leading-relaxed">
                  {selectedFolio.special_requests || 'No specific requests filed. Standard 5-star Maiduguri welcome protocol applies.'}
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-[#818E9B] font-bold mb-1">
                  Contact Information
                </label>
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#EAEFF4] text-xs space-y-1">
                  <div className="flex items-center gap-2 text-[#556376]">
                    <Mail className="w-3.5 h-3.5 text-[#135846]" />
                    <span>{selectedFolio.guest_email || 'No email provided'}</span>
                  </div>
                  {selectedFolio.guest_phone && (
                    <div className="flex items-center gap-2 text-[#556376]">
                      <Phone className="w-3.5 h-3.5 text-[#135846]" />
                      <span>{selectedFolio.guest_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAEFF4]">
              <button
                onClick={() => setSelectedFolio(null)}
                className="px-4 py-2 rounded-xl bg-[#F4F6F9] hover:bg-[#EAEFF4] text-xs font-semibold text-[#556376] transition-colors"
              >
                Close Folio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal (Available when guest has paid) */}
      {printingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl">
            <PaymentReceipt
              receipt={{
                receiptNo: (printingReceipt as any).booking_code || printingReceipt.booking_reference,
                guestName: printingReceipt.guest_name,
                roomNo: printingReceipt.room_number,
                roomName: printingReceipt.room_type_name,
                nights: printingReceipt.total_nights,
                roomRate: parseFloat(String(printingReceipt.total_amount)) / printingReceipt.total_nights,
                accommodationTotal: parseFloat(String(printingReceipt.total_amount)),
                restaurantCharges: 0,
                totalAmount: parseFloat(String(printingReceipt.total_amount)),
                amountPaid: parseFloat(String(printingReceipt.total_amount)),
                balanceDue: 0,
                paymentMethod: (printingReceipt as any).payment_status === 'paid_at_desk' ? 'Cash / POS at Desk' : 'City Star Mobile App',
                paymentStatus: 'PAID',
              }}
              onClose={() => setPrintingReceipt(null)}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
