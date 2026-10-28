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
  Printer,
  Loader2,
  FileText,
} from 'lucide-react';
import { fetchAdminBookings, updateBookingStatus, AdminActionBooking } from '../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import { PaymentReceipt } from '../../../../components/PaymentReceipt';

export default function BookingsManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedNotesBooking, setSelectedNotesBooking] = useState<AdminActionBooking | null>(null);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<AdminActionBooking | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

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
        message: `Reservation status updated to "${variables.status.replace('_', ' ')}".`,
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

  const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const tabs = [
    { id: 'all', label: 'All Guest' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Booked' },
    { id: 'checked_in', label: 'Checked In' },
    { id: 'cancelled', label: 'Canceled' },
    { id: 'refund', label: 'Refund' },
  ];

  const toggleSelectAll = () => {
    if (selectedRowIds.length === bookings.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(bookings.map((b) => b.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter((rowId) => rowId !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  // Helper avatar generator using initials
  const getAvatarInitials = (name?: string) => {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg ${
            notification.type === 'success'
              ? 'bg-[#EBF7F2] border border-[#135846]/20 text-[#135846]'
              : 'bg-[#FFEBEB] border border-[#FE5757]/20 text-[#FE5757]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#135846]" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FE5757]" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Main Guest List Table Container (matches Travl reference) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-[#EAEFF4] space-y-6">
        {/* Top Controls: Filter Tabs & Right Action Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EAEFF4]">
          {/* Navigation Tabs (Underlined Style from reference image) */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const isActive = status === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatus(tab.id);
                    setPage(1);
                  }}
                  className={`text-sm font-bold relative pb-3 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[#135846]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#135846] rounded-full animate-in fade-in duration-200" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Filters: Deep Forest Green Date Pill + Sort Pill */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or room..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F4F6F9] border border-transparent focus:border-[#135846] focus:bg-white rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none w-44 sm:w-56 transition-all"
              />
            </div>

            {/* Deep Green Date Filter Pill */}
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#135846] text-white text-xs font-semibold shadow-sm hover:bg-[#0e4536] transition-colors cursor-pointer">
              <Calendar className="w-3.5 h-3.5" />
              <span>Stay Range</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-white text-[11px] outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Sort Pill */}
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-white border border-[#EAEFF4] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isFetching ? 'animate-spin text-[#135846]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-[#EAEFF4]">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={bookings.length > 0 && selectedRowIds.length === bookings.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#135846] focus:ring-[#135846] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-bold text-gray-500">Guest</th>
                <th className="py-3 px-4 font-bold text-gray-500">Order Date</th>
                <th className="py-3 px-4 font-bold text-gray-500">Check In</th>
                <th className="py-3 px-4 font-bold text-gray-500">Check Out</th>
                <th className="py-3 px-4 font-bold text-gray-500">Special Request</th>
                <th className="py-3 px-4 font-bold text-gray-500">Room Type</th>
                <th className="py-3 px-4 font-bold text-gray-500">Status</th>
                <th className="py-3 px-4 font-bold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF4]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#135846]" />
                    <span>Loading hotel guest list...</span>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="text-base font-bold text-gray-600 mb-1">No Reservations Found</div>
                    <div className="text-xs">Adjust your status filter or search parameters.</div>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const isChecked = selectedRowIds.includes(b.id);
                  const isPaid = b.status !== 'cancelled';
                  const initials = getAvatarInitials(b.guest_name);

                  // Colors for avatar
                  const avatarColors = [
                    'bg-[#FE5757]/10 text-[#FE5757]',
                    'bg-[#135846]/10 text-[#135846]',
                    'bg-[#4A85F6]/10 text-[#4A85F6]',
                    'bg-[#F59E0B]/10 text-[#F59E0B]',
                    'bg-[#8B5CF6]/10 text-[#8B5CF6]',
                  ];
                  const colorClass = avatarColors[b.guest_name ? b.guest_name.charCodeAt(0) % avatarColors.length : 0];

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-[#F9FBFC] transition-colors group ${isChecked ? 'bg-[#F4F8F6]' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(b.id)}
                          className="rounded border-gray-300 text-[#135846] focus:ring-[#135846] cursor-pointer"
                        />
                      </td>

                      {/* Guest Column with Avatar & Subtext Ref */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${colorClass}`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#1E2538] text-sm leading-tight group-hover:text-[#135846] transition-colors">
                              {b.guest_name || 'Verified Resident'}
                            </div>
                            <div className="text-[11px] font-mono font-semibold text-[#FE5757] mt-0.5">
                              #{b.booking_reference}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="py-4 px-4 text-xs text-gray-500">
                        <div className="font-medium text-gray-700">
                          {b.created_at ? formatDate(b.created_at) : formatDate(b.check_in_date)}
                        </div>
                        <div className="text-[10px] text-gray-400">09:21 AM</div>
                      </td>

                      {/* Check In */}
                      <td className="py-4 px-4 text-xs">
                        <div className="font-bold text-[#1E2538]">
                          {formatDate(b.check_in_date)}
                        </div>
                        <div className="text-[10px] text-gray-400">02:00 PM</div>
                      </td>

                      {/* Check Out */}
                      <td className="py-4 px-4 text-xs">
                        <div className="font-bold text-[#1E2538]">
                          {formatDate(b.check_out_date)}
                        </div>
                        <div className="text-[10px] text-gray-400">11:00 AM</div>
                      </td>

                      {/* Special Request Pill Button ("View Notes") */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedNotesBooking(b)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#EBF7F2] hover:bg-[#D5EFE4] text-[#135846] text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
                        >
                          View Notes
                        </button>
                      </td>

                      {/* Room Type */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-xs text-[#1E2538]">
                          {b.room_type_name || 'Deluxe King Suite'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Room #{b.room_number || '204'} • Floor {b.floor || 2}
                        </div>
                      </td>

                      {/* Status Pastel Badge (exact styling from reference) */}
                      <td className="py-4 px-4">
                        {b.status === 'confirmed' ? (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E8F8F0] text-[#135846]">
                            Booked
                          </span>
                        ) : b.status === 'checked_in' ? (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EBF4FF] text-[#1D4ED8]">
                            Checked In
                          </span>
                        ) : b.status === 'pending' ? (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FFF8E6] text-[#D97706]">
                            Pending
                          </span>
                        ) : b.status === 'checked_out' ? (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F3F4F6] text-gray-600">
                            Checked Out
                          </span>
                        ) : (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#FFEBEB] text-[#FE5757]">
                            Refund
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Print Official Receipt Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptBooking(b)}
                            title="Print Official Folio / Receipt"
                            className="p-1.5 rounded-xl border border-[#EAEFF4] hover:border-[#135846] text-gray-500 hover:text-[#135846] hover:bg-[#EBF7F2] transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Check-In Button */}
                          {b.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => statusMutation.mutate({ bookingId: b.id, status: 'checked_in' })}
                              className="px-2.5 py-1 rounded-xl bg-[#135846] hover:bg-[#0e4335] text-white font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <LogIn className="w-3 h-3" />
                              <span>Check In</span>
                            </button>
                          )}

                          {/* Quick Check-Out Button */}
                          {b.status === 'checked_in' && (
                            <button
                              type="button"
                              onClick={() => statusMutation.mutate({ bookingId: b.id, status: 'checked_out' })}
                              className="px-2.5 py-1 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <LogOut className="w-3 h-3" />
                              <span>Check Out</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#EAEFF4] text-xs text-gray-500 gap-4">
          <div>
            Showing <strong className="text-gray-900">{bookings.length}</strong> of{' '}
            <strong className="text-gray-900">{pagination.total}</strong> guest reservations
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3.5 py-1.5 rounded-xl bg-[#F4F6F9] hover:bg-gray-200 border border-[#EAEFF4] disabled:opacity-40 text-gray-700 font-semibold transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="px-2 font-bold text-gray-700">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3.5 py-1.5 rounded-xl bg-[#F4F6F9] hover:bg-gray-200 border border-[#EAEFF4] disabled:opacity-40 text-gray-700 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Special Requests / Notes Modal ("View Notes") */}
      {selectedNotesBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 text-[#1E2538] space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF7F2] text-[#135846] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Guest Reservation Notes
                  </h3>
                  <span className="font-mono text-xs text-[#FE5757] font-semibold">
                    {selectedNotesBooking.booking_reference} • {selectedNotesBooking.guest_name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotesBooking(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Special Requests / Concierge Directives
                </label>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100 text-gray-800 text-sm leading-relaxed">
                  {selectedNotesBooking.special_requests || 'No specific requests filed. Standard 5-star Maiduguri welcome protocol applies.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">Suite Category</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedNotesBooking.room_type_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">Room Assigned</span>
                  <span className="font-bold text-gray-900 text-sm">Room #{selectedNotesBooking.room_number || '204'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">Guest Contact</span>
                  <span className="text-gray-700">{selectedNotesBooking.guest_email || selectedNotesBooking.guest_phone || 'On file'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">Duration</span>
                  <span className="text-gray-700">{selectedNotesBooking.total_nights} Nights ({formatDate(selectedNotesBooking.check_in_date)} - {formatDate(selectedNotesBooking.check_out_date)})</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedNotesBooking(null)}
                className="px-5 py-2.5 rounded-xl bg-[#135846] text-white text-xs font-bold hover:bg-[#0e4335] transition-colors"
              >
                Close Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="my-8 max-w-md w-full">
            <PaymentReceipt
              receipt={{
                receiptNo: selectedReceiptBooking.booking_reference,
                date: selectedReceiptBooking.check_in_date,
                guestName: selectedReceiptBooking.guest_name || 'Verified Resident',
                roomNo: selectedReceiptBooking.room_number || '204',
                roomName: selectedReceiptBooking.room_type_name || 'Deluxe Room',
                nights: selectedReceiptBooking.total_nights || 1,
                roomRate: Math.round(Number(selectedReceiptBooking.total_amount) / (selectedReceiptBooking.total_nights || 1)),
                accommodationTotal: Number(selectedReceiptBooking.total_amount),
                restaurantCharges: 0,
                totalAmount: Number(selectedReceiptBooking.total_amount),
                amountPaid: Number(selectedReceiptBooking.total_amount),
                balanceDue: 0,
                paymentMethod: 'Bank transfer',
                paymentStatus: selectedReceiptBooking.status === 'cancelled' ? 'PENDING' : 'PAID',
              }}
              onClose={() => setSelectedReceiptBooking(null)}
              showActions={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
