'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Bed,
  DollarSign,
  LogIn,
  LogOut,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
  Lock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { fetchAdminOverview, updateBookingStatus, AdminActionBooking } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'arrivals' | 'in_house' | 'departures'>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: overview, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetchAdminOverview(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' }) =>
      updateBookingStatus(bookingId, status),
    onSuccess: (_, variables) => {
      const actionText =
        variables.status === 'checked_in'
          ? 'Guest checked in successfully. Room marked as Occupied.'
          : variables.status === 'checked_out'
          ? 'Guest checked out. Room released to Available.'
          : variables.status === 'confirmed'
          ? 'Reservation confirmed.'
          : 'Reservation status updated.';
      setNotification({ type: 'success', message: actionText });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Operation failed' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const kpis = overview?.kpis;
  const todaysActions = Array.isArray(overview?.todaysActions) ? overview.todaysActions : [];

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredActions = todaysActions.filter((b) => {
    if (activeTab === 'pending') {
      return b.status === 'pending';
    }
    if (activeTab === 'arrivals') {
      return b.check_in_date?.startsWith(todayStr) || b.status === 'confirmed' || b.status === 'pending';
    }
    if (activeTab === 'in_house') {
      return b.status === 'checked_in';
    }
    if (activeTab === 'departures') {
      return b.check_out_date?.startsWith(todayStr) || b.status === 'checked_in' || b.status === 'checked_out';
    }
    return true;
  });

  const pendingCount = todaysActions.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#135846] font-bold block mb-1">
            Dashboard Overview
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538] tracking-tight">
            Hotel Operations & Front Desk
          </h1>
          <p className="text-[#818E9B] text-xs sm:text-sm font-normal mt-1">
            Real-time occupancy metrics, VIP check-ins, and room inventory management.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEFF4] text-xs font-semibold text-[#556376] hover:text-[#1E2538] hover:border-[#D1D9E2] shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#135846]' : 'text-[#818E9B]'}`} />
          <span>Refresh Live Data</span>
        </button>
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

      {/* 4-Card KPI Summary Banner (Travl Light Hospitality Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Occupancy Rate */}
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
              {isLoading ? '...' : `${kpis?.occupancyRate || 0}%`}
            </span>
            <span className="text-xs text-[#818E9B] font-medium">
              ({kpis?.occupiedRooms || 0} / {kpis?.totalRooms || 0} Rooms)
            </span>
          </div>
          <div className="text-xs text-[#556376] flex items-center gap-2 mt-3 pt-3 border-t border-[#F4F6F9]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#135846] animate-pulse" />
            <span>
              <strong className="text-[#135846] font-semibold">{kpis?.availableRooms || 0}</strong> Available • {kpis?.maintenanceRooms || 0} Maint.
            </span>
          </div>
        </div>

        {/* KPI 2: Revenue MTD & YTD */}
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
            {isLoading ? (
              <span className="font-serif text-3xl font-bold text-[#135846]">...</span>
            ) : kpis?.monthToDateRevenue === null ? (
              <span className="text-xs font-semibold text-[#818E9B] flex items-center gap-1.5 py-1.5">
                <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Super Admin Protected</span>
              </span>
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-[#135846] font-serif">
                {formatCurrency(kpis?.monthToDateRevenue || 0)}
              </span>
            )}
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center justify-between">
            {kpis?.yearToDateRevenue === null ? (
              <span className="text-[#818E9B]">Financials Protected</span>
            ) : (
              <>
                <span className="text-[#818E9B]">YTD:</span>
                <strong className="text-[#1E2538] font-semibold">{formatCurrency(kpis?.yearToDateRevenue || 0)}</strong>
              </>
            )}
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
              {isLoading ? '...' : kpis?.checkInsToday || 0}
            </span>
            <span className="text-xs text-[#818E9B] font-medium">Guests Checking In</span>
          </div>
          <div className="text-xs mt-3 pt-3 border-t border-[#F4F6F9] flex items-center gap-1.5">
            {pendingCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#FE5757] animate-pulse" />
                <span className="text-[#FE5757] font-semibold">
                  {pendingCount} New Pending Requests
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
              {isLoading ? '...' : kpis?.checkOutsToday || 0}
            </span>
            <span className="text-xs text-[#818E9B] font-medium">Guests Checking Out</span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#818E9B]" />
            <span>
              {kpis?.activeBookings ?? todaysActions.length} Total Bookings in System
            </span>
          </div>
        </div>
      </div>

      {/* Immediate Action Center: Live Reservations & Front Desk Queue (Travl Table Style) */}
      <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
        {/* Card Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E2538] flex items-center gap-3">
              <span>Live Reservations & Front Desk Queue</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8F8F0] text-[#135846] font-sans font-bold">
                {filteredActions.length} Records
              </span>
            </h2>
            <p className="text-[#818E9B] text-xs sm:text-sm font-normal mt-1">
              Trigger instant check-in, review pending requests, release rooms upon departure, and manage guest folios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#135846] hover:bg-[#0e4335] text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
            >
              <span>Full Guest Registry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Travl Underlined Filter Tabs */}
        <div className="flex items-center gap-6 border-b border-[#EAEFF4] overflow-x-auto pb-px text-sm">
          {[
            { id: 'all', label: `All (${todaysActions.length})` },
            { id: 'pending', label: `Pending`, badge: pendingCount },
            { id: 'arrivals', label: "Today's Check-In" },
            { id: 'in_house', label: 'In-House' },
            { id: 'departures', label: "Today's Check-Out" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3.5 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'text-[#135846] border-b-2 border-[#135846]'
                    : 'text-[#818E9B] hover:text-[#1E2538]'
                }`}
              >
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FE5757] text-white text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Table */}
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full text-left text-sm text-[#556376]">
            <thead className="text-[11px] uppercase tracking-wider text-[#818E9B] bg-[#F9FAFC] border-y border-[#EAEFF4]">
              <tr>
                <th className="py-3.5 px-6 font-semibold">Guest & Contact</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Suite</th>
                <th className="py-3.5 px-4 font-semibold">Stay Dates</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Front Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF4]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#818E9B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#135846]" />
                      <span>Loading live front desk schedules...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#818E9B]">
                    No reservations found matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredActions.map((booking: AdminActionBooking) => {
                  const isCheckedIn = booking.status === 'checked_in';
                  const isConfirmed = booking.status === 'confirmed';
                  const isPending = booking.status === 'pending';
                  const isCancelled = booking.status === 'cancelled';
                  const isCheckedOut = booking.status === 'checked_out';

                  const checkInFormatted = formatDate(booking.check_in_date);
                  const isTodayArrival = booking.check_in_date?.startsWith(todayStr);
                  const isTodayDeparture = booking.check_out_date?.startsWith(todayStr);

                  // Extract guest initials for Travl circular avatar
                  const initials = (booking.guest_name || 'Guest')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={booking.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      {/* Guest Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#EBF4FF] text-[#1D4ED8] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#1E2538] group-hover:text-[#135846] transition-colors">
                                {booking.guest_name}
                              </span>
                              {isPending && (
                                <span className="px-1.5 py-0.5 rounded bg-[#FFF8E6] text-[#D97706] text-[9px] uppercase font-bold tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#818E9B]">{booking.guest_email}</div>
                            <div className="font-mono text-[11px] text-[#FE5757] font-semibold mt-0.5">
                              {booking.booking_reference}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Room Column */}
                      <td className="py-4 px-4">
                        <div className="text-[#1E2538] font-medium flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-[#F4F6F9] border border-[#EAEFF4] font-mono text-xs font-semibold text-[#1E2538]">
                            #{booking.room_number}
                          </span>
                          <span>{booking.room_type_name}</span>
                        </div>
                        <div className="text-xs text-[#818E9B] mt-0.5">Floor {booking.floor}</div>
                      </td>

                      {/* Dates Column */}
                      <td className="py-4 px-4 text-xs">
                        <div className="text-[#1E2538] font-medium">
                          {checkInFormatted} — {formatDate(booking.check_out_date)}
                        </div>
                        <div className="text-[#818E9B] flex items-center gap-1 mt-0.5">
                          <span>{booking.total_nights} Nights</span>
                          {isTodayArrival && (
                            <span className="text-[#135846] font-semibold">• Check-In Today</span>
                          )}
                          {isTodayDeparture && (
                            <span className="text-[#FE5757] font-semibold">• Check-Out Today</span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 font-serif font-bold text-[#1E2538]">
                        {formatCurrency(booking.total_amount)}
                      </td>

                      {/* Status Badge (Travl Soft Pastel Pill) */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            booking.status === 'checked_in'
                              ? 'bg-[#EBF4FF] text-[#1D4ED8]'
                              : booking.status === 'confirmed'
                              ? 'bg-[#E8F8F0] text-[#135846]'
                              : booking.status === 'pending'
                              ? 'bg-[#FFF8E6] text-[#D97706]'
                              : booking.status === 'checked_out'
                              ? 'bg-[#F1F3F6] text-[#556376]'
                              : 'bg-[#FFEBEB] text-[#FE5757]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                                disabled={statusMutation.isPending}
                                className="px-3 py-1.5 rounded-xl bg-[#135846] hover:bg-[#0e4335] text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                                title="Confirm this reservation"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                              <button
                                onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'checked_in' })}
                                disabled={statusMutation.isPending}
                                className="px-3 py-1.5 rounded-xl bg-[#4A85F6] hover:bg-[#3b72db] text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                                title="Check In guest now"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Check In</span>
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'checked_in' })}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-[#4A85F6] hover:bg-[#3b72db] text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                          )}

                          {isCheckedIn && (
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'checked_out' })}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-[#FE5757] hover:bg-[#e04545] text-white font-semibold text-xs shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Check Out</span>
                            </button>
                          )}

                          {!isCancelled && !isCheckedOut && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel reservation for ${booking.guest_name}? This will release the room.`)) {
                                  statusMutation.mutate({ bookingId: booking.id, status: 'cancelled' });
                                }
                              }}
                              disabled={statusMutation.isPending}
                              className="px-2.5 py-1.5 rounded-xl border border-[#FE5757]/30 text-[#FE5757] hover:bg-[#FFEBEB] text-xs font-medium transition-colors"
                              title="Cancel Reservation"
                            >
                              Cancel
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
    </div>
  );
}
