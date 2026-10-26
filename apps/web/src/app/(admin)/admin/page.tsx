'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { fetchAdminOverview, updateBookingStatus, AdminActionBooking } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'arrivals' | 'departures'>('all');
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
  const todaysActions = overview?.todaysActions || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredActions = todaysActions.filter((b) => {
    if (activeTab === 'arrivals') {
      return b.status === 'confirmed' || b.status === 'pending';
    }
    if (activeTab === 'departures') {
      return b.status === 'checked_in';
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
            Command Center
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Operations & Front Desk
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-light mt-1">
            Real-time occupancy metrics, guest check-ins, and room inventory management.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-hotel-gold' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 4-Card KPI Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Occupancy Rate */}
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Live Occupancy
            </span>
            <div className="w-10 h-10 rounded-2xl bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center text-hotel-gold">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-bold text-white">
              {isLoading ? '...' : `${kpis?.occupancyRate || 0}%`}
            </span>
            <span className="text-xs text-gray-400">
              ({kpis?.occupiedRooms || 0} / {kpis?.totalRooms || 0} Rooms)
            </span>
          </div>
          <div className="text-xs text-gray-400 font-light flex items-center gap-2 mt-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{kpis?.availableRooms || 0} Available • {kpis?.maintenanceRooms || 0} Maint.</span>
          </div>
        </div>

        {/* KPI 2: Revenue MTD & YTD */}
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Revenue (Month-To-Date)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-bold text-hotel-gold">
              {isLoading ? '...' : formatCurrency(kpis?.monthToDateRevenue || 0)}
            </span>
          </div>
          <div className="text-xs text-gray-400 font-light mt-3">
            YTD: <strong className="text-white">{formatCurrency(kpis?.yearToDateRevenue || 0)}</strong>
          </div>
        </div>

        {/* KPI 3: Check-Ins Today */}
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Check-Ins Expected Today
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <LogIn className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-bold text-white">
              {isLoading ? '...' : kpis?.checkInsToday || 0}
            </span>
            <span className="text-xs text-gray-400">Arrivals</span>
          </div>
          <div className="text-xs text-blue-400/80 font-light mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Standard arrival window: 3 PM+</span>
          </div>
        </div>

        {/* KPI 4: Check-Outs Today */}
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Check-Outs Expected Today
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <LogOut className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-bold text-white">
              {isLoading ? '...' : kpis?.checkOutsToday || 0}
            </span>
            <span className="text-xs text-gray-400">Departures</span>
          </div>
          <div className="text-xs text-purple-400/80 font-light mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Housekeeping turnaround active</span>
          </div>
        </div>
      </div>

      {/* Immediate Action Center: Today's Arrivals & Departures */}
      <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <span>Arrivals & Departures</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-hotel-gold/10 text-hotel-gold border border-hotel-gold/30 font-sans">
                {filteredActions.length} Pending Actions
              </span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm font-light mt-1">
              Trigger instant check-in, check-out, or cancellation with automatic physical room synchronization.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === 'all' ? 'bg-hotel-gold text-hotel-dark' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Actions
            </button>
            <button
              onClick={() => setActiveTab('arrivals')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === 'arrivals' ? 'bg-hotel-gold text-hotel-dark' : 'text-gray-400 hover:text-white'
              }`}
            >
              Arrivals
            </button>
            <button
              onClick={() => setActiveTab('departures')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeTab === 'departures' ? 'bg-hotel-gold text-hotel-dark' : 'text-gray-400 hover:text-white'
              }`}
            >
              Departures
            </button>
          </div>
        </div>

        {/* Action Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 bg-white/5">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Guest & Contact</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Suite</th>
                <th className="py-3.5 px-4 font-semibold">Stay Dates</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Current Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Loading front desk schedules...
                  </td>
                </tr>
              ) : filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No pending arrivals or departures scheduled for today.
                  </td>
                </tr>
              ) : (
                filteredActions.map((booking: AdminActionBooking) => {
                  const isCheckedIn = booking.status === 'checked_in';
                  const isConfirmed = booking.status === 'confirmed' || booking.status === 'pending';
                  const isCancelled = booking.status === 'cancelled';

                  return (
                    <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Guest Column */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{booking.guest_name}</div>
                        <div className="text-xs text-gray-400">{booking.guest_email}</div>
                        <div className="font-mono text-[10px] text-hotel-gold mt-0.5">
                          {booking.booking_reference}
                        </div>
                      </td>

                      {/* Room Column */}
                      <td className="py-4 px-4">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-xs">
                            #{booking.room_number}
                          </span>
                          <span>{booking.room_type_name}</span>
                        </div>
                        <div className="text-xs text-gray-500">Floor {booking.floor}</div>
                      </td>

                      {/* Dates Column */}
                      <td className="py-4 px-4 text-xs">
                        <div className="text-gray-200">
                          {formatDate(booking.check_in_date)} — {formatDate(booking.check_out_date)}
                        </div>
                        <div className="text-gray-500">{booking.total_nights} Nights</div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 font-serif font-bold text-white">
                        {formatCurrency(booking.total_amount)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            booking.status === 'checked_in'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : booking.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : booking.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isConfirmed && (
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'checked_in' })}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all flex items-center gap-1"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                          )}

                          {isCheckedIn && (
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: booking.id, status: 'checked_out' })}
                              disabled={statusMutation.isPending}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 transition-all flex items-center gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Check Out</span>
                            </button>
                          )}

                          {!isCancelled && booking.status !== 'checked_out' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel reservation for ${booking.guest_name}? This will release the room.`)) {
                                  statusMutation.mutate({ bookingId: booking.id, status: 'cancelled' });
                                }
                              }}
                              disabled={statusMutation.isPending}
                              className="px-2.5 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/40 text-xs transition-colors"
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
