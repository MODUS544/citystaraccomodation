'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck2,
  Search,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { fetchAdminBookings, updateBookingStatus, AdminActionBooking } from '../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../lib/utils';

export default function BookingsManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-bookings', page, status, search, startDate, endDate],
    queryFn: () =>
      fetchAdminBookings({
        page,
        limit: 10,
        status,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' }) =>
      updateBookingStatus(bookingId, status),
    onSuccess: (_, variables) => {
      setNotification({
        type: 'success',
        message: `Reservation status updated to "${variables.status}".`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Failed to update reservation' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const bookings = data?.bookings || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
            Reservations Control
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Guest Bookings
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-light mt-1">
            Search, filter by stay dates, and manage booking lifecycles with room allocation.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-hotel-gold' : ''}`} />
          <span>Refresh List</span>
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

      {/* Search & Filter Controls */}
      <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, guest, room..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold cursor-pointer [color-scheme:dark]"
            >
              <option value="all" className="bg-[#0F1626]">All Statuses</option>
              <option value="pending" className="bg-[#0F1626]">Pending</option>
              <option value="confirmed" className="bg-[#0F1626]">Confirmed</option>
              <option value="checked_in" className="bg-[#0F1626]">Checked In</option>
              <option value="checked_out" className="bg-[#0F1626]">Checked Out</option>
              <option value="cancelled" className="bg-[#0F1626]">Cancelled</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[10px] uppercase text-hotel-gold font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none [color-scheme:dark] w-full"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[10px] uppercase text-hotel-gold font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-white focus:outline-none [color-scheme:dark] w-full"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 bg-white/5">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Reference & Guest</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Suite</th>
                <th className="py-3.5 px-4 font-semibold">Check-In / Out</th>
                <th className="py-3.5 px-4 font-semibold">Total Cost</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Loading reservations database...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No reservations matching current search criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{b.guest_name}</div>
                        <div className="text-xs text-gray-400">{b.guest_email}</div>
                        <div className="font-mono text-[10px] text-hotel-gold mt-0.5">
                          {b.booking_reference}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-xs">
                            #{b.room_number}
                          </span>
                          <span>{b.room_type_name}</span>
                        </div>
                        <div className="text-xs text-gray-500">Floor {b.floor}</div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="text-gray-200">
                          {formatDate(b.check_in_date)} — {formatDate(b.check_out_date)}
                        </div>
                        <div className="text-gray-500">{b.total_nights} Nights</div>
                      </td>

                      <td className="py-4 px-4 font-serif font-bold text-white">
                        {formatCurrency(b.total_amount)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            b.status === 'checked_in'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : b.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : b.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: b.id, status: 'checked_in' })}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Check In</span>
                            </button>
                          )}

                          {b.status === 'checked_in' && (
                            <button
                              onClick={() => statusMutation.mutate({ bookingId: b.id, status: 'checked_out' })}
                              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check Out</span>
                            </button>
                          )}

                          {b.status !== 'cancelled' && b.status !== 'checked_out' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel reservation ${b.booking_reference}?`)) {
                                  statusMutation.mutate({ bookingId: b.id, status: 'cancelled' });
                                }
                              }}
                              className="px-2 py-1 rounded-xl border border-white/10 hover:border-red-500 text-gray-400 hover:text-red-400 text-xs transition-colors"
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-400">
            <div>
              Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong> (
              <strong className="text-white">{pagination.total}</strong> total reservations)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors flex items-center gap-1 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors flex items-center gap-1 text-white"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
