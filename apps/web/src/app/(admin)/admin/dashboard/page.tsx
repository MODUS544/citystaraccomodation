'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Bed,
  Users,
  Shield,
  ShieldCheck,
  RefreshCw,
  Edit2,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Filter,
  Search,
  Check,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  fetchDetailedAnalytics,
  fetchAdminUsers,
  updateUserRole,
  fetchAdminRooms,
  updateRoomRate,
  UserProfileRecord,
  AdminRoom,
} from '../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../lib/utils';

export default function MasterExecutiveDashboardPage() {
  const queryClient = useQueryClient();
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'rates'>('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [editingRoom, setEditingRoom] = useState<{ id: string; price: number; is_available: boolean } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Queries
  const { data: analyticsData, isLoading: isLoadingAnalytics, refetch: refetchAnalytics, isFetching: isFetchingAnalytics } = useQuery({
    queryKey: ['executive-analytics', analyticsPeriod],
    queryFn: () => fetchDetailedAnalytics(analyticsPeriod),
  });

  const { data: users, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchAdminUsers(),
  });

  const { data: rooms, isLoading: isLoadingRooms, refetch: refetchRooms } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => fetchAdminRooms(),
  });

  // Role mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'customer' | 'staff' | 'super_admin' }) =>
      updateUserRole(userId, role),
    onSuccess: (updatedUser) => {
      setNotification({
        type: 'success',
        message: `Role for "${updatedUser.full_name || updatedUser.email}" updated to ${updatedUser.role.toUpperCase()}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Failed to update user role' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  // Room rate mutation
  const roomRateMutation = useMutation({
    mutationFn: ({ roomId, price, is_available }: { roomId: string; price?: number; is_available?: boolean }) =>
      updateRoomRate(roomId, { price_per_night: price, is_available }),
    onSuccess: () => {
      setNotification({
        type: 'success',
        message: 'Room rate & availability updated successfully.',
      });
      setEditingRoom(null);
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['executive-analytics'] });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Failed to update room rate' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const metrics = analyticsData?.metrics;
  const filteredUsers = (users || []).filter(
    (u) =>
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#135846] font-bold block mb-1">
            Master Executive Control Center
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538]">
            City Star Hotel & Suites Executive Dashboard
          </h1>
          <p className="text-[#818E9B] text-xs sm:text-sm mt-0.5">
            Full authority over financial analytics, room rates (₦), user roles, and operational capacity in Maiduguri.
          </p>
        </div>

        <button
          onClick={() => {
            refetchAnalytics();
            refetchUsers();
            refetchRooms();
          }}
          disabled={isFetchingAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEFF4] text-xs font-semibold text-[#556376] hover:text-[#1E2538] shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAnalytics ? 'animate-spin text-[#135846]' : 'text-[#818E9B]'}`} />
          <span>Sync Executive Data</span>
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

      {/* 4 Core Financial KPI Metric Cards (Analytics Engine) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Gross Revenue (₦) */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              Gross Revenue ({analyticsPeriod})
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] text-[#135846] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#135846]">
              {isLoadingAnalytics ? '...' : formatCurrency(metrics?.grossRevenue || 0)}
            </span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center justify-between">
            <span className="text-[#818E9B]">Sold Nights:</span>
            <strong className="text-[#1E2538] font-semibold">{metrics?.totalNightsSold || 0} Nights</strong>
          </div>
        </div>

        {/* KPI 2: ADR (Average Daily Rate) */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              ADR (Avg Daily Rate)
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#FFF8E6] text-[#D97706] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538]">
              {isLoadingAnalytics ? '...' : formatCurrency(metrics?.adr || 0)}
            </span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center justify-between">
            <span className="text-[#818E9B]">Per Room Night</span>
            <span className="text-[#135846] font-semibold">Optimal Pricing</span>
          </div>
        </div>

        {/* KPI 3: Occupancy Rate % */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              Occupancy Rate %
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#EBF4FF] text-[#1D4ED8] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-[#1E2538] font-sans">
              {isLoadingAnalytics ? '...' : `${metrics?.occupancyRate || 0}%`}
            </span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center justify-between">
            <span className="text-[#818E9B]">Capacity Base:</span>
            <strong className="text-[#1E2538] font-semibold">{metrics?.totalRooms || 0} Physical Suites</strong>
          </div>
        </div>

        {/* KPI 4: RevPAR (Revenue Per Available Room) */}
        <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#818E9B] font-semibold">
              RevPAR (Yield)
            </span>
            <div className="w-11 h-11 rounded-2xl bg-[#FFEBEB] text-[#FE5757] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538]">
              {isLoadingAnalytics ? '...' : formatCurrency(metrics?.revPar || 0)}
            </span>
          </div>
          <div className="text-xs text-[#556376] mt-3 pt-3 border-t border-[#F4F6F9] flex items-center justify-between">
            <span className="text-[#818E9B]">ADR × Occupancy</span>
            <span className="text-[#135846] font-semibold">5-Star Benchmark</span>
          </div>
        </div>
      </div>

      {/* Main Executive Tabs Container */}
      <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAEFF4] pb-px">
          <div className="flex items-center gap-6 overflow-x-auto text-sm">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`pb-3.5 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'text-[#135846] border-b-2 border-[#135846]'
                  : 'text-[#818E9B] hover:text-[#1E2538]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Revenue Analytics Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-3.5 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'staff'
                  ? 'text-[#135846] border-b-2 border-[#135846]'
                  : 'text-[#818E9B] hover:text-[#1E2538]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff User Management ({users?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('rates')}
              className={`pb-3.5 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'rates'
                  ? 'text-[#135846] border-b-2 border-[#135846]'
                  : 'text-[#818E9B] hover:text-[#1E2538]'
              }`}
            >
              <Bed className="w-4 h-4" />
              <span>Rooms & Nightly Rates (₦)</span>
            </button>
          </div>

          {/* Timeframe Filter Buttons for Analytics Engine */}
          {activeTab === 'analytics' && (
            <div className="flex items-center gap-1.5 bg-[#F4F6F9] p-1 rounded-2xl border border-[#EAEFF4] text-xs font-semibold self-start sm:self-auto">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                    analyticsPeriod === p
                      ? 'bg-[#135846] text-white shadow-sm font-bold'
                      : 'text-[#818E9B] hover:text-[#1E2538]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: ANALYTICS ENGINE DETAILS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1E2538]">
                  Periodic Revenue & Reservation Trend ({analyticsPeriod.toUpperCase()})
                </h3>
                <p className="text-xs text-[#818E9B]">
                  Aggregated gross yield, bookings volume, and occupied night totals.
                </p>
              </div>
            </div>

            {/* Periodic Trend Breakdown Table */}
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left text-sm text-[#556376]">
                <thead className="text-[11px] uppercase tracking-wider text-[#818E9B] bg-[#F9FAFC] border-y border-[#EAEFF4]">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Period Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Bookings Volume</th>
                    <th className="py-3 px-4 font-semibold">Nights Sold</th>
                    <th className="py-3 px-6 font-semibold text-right">Gross Revenue (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF4]">
                  {analyticsData?.trend?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-[#818E9B]">
                        No transactions recorded for the selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    analyticsData?.trend?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-6 font-mono text-xs font-semibold text-[#1E2538]">
                          {row.date_label}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#1E2538]">
                          {row.bookings} Reservations
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#1E2538]">
                          {row.nights} Nights
                        </td>
                        <td className="py-3.5 px-6 font-serif font-bold text-[#135846] text-right">
                          {formatCurrency(row.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF USER MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1E2538]">
                  Staff & User Role Directory
                </h3>
                <p className="text-xs text-[#818E9B]">
                  Assign or revoke staff and super_admin privileges. New registrations default to Customer.
                </p>
              </div>

              {/* User search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#818E9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#F4F6F9] border border-[#EAEFF4] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1E2538] focus:outline-none focus:border-[#135846]"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left text-sm text-[#556376]">
                <thead className="text-[11px] uppercase tracking-wider text-[#818E9B] bg-[#F9FAFC] border-y border-[#EAEFF4]">
                  <tr>
                    <th className="py-3 px-6 font-semibold">User Details</th>
                    <th className="py-3 px-4 font-semibold">Email & Phone</th>
                    <th className="py-3 px-4 font-semibold">Registered</th>
                    <th className="py-3 px-4 font-semibold">Assigned Role</th>
                    <th className="py-3 px-6 font-semibold text-right">Update Role Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF4]">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[#818E9B]">
                        Loading registered user directory...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[#818E9B]">
                        No users match the search term.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuperAdmin = u.role === 'super_admin';
                      const isStaff = u.role === 'staff';
                      return (
                        <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="font-semibold text-sm text-[#1E2538]">{u.full_name || 'Guest User'}</div>
                            <div className="font-mono text-[10px] text-[#818E9B]">{u.id}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="text-[#1E2538]">{u.email}</div>
                            <div className="text-[#818E9B] text-[11px]">{u.phone_number || 'No phone'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#818E9B]">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                isSuperAdmin
                                  ? 'bg-[#E8F8F0] text-[#135846] border border-[#135846]/20'
                                  : isStaff
                                  ? 'bg-[#EBF4FF] text-[#1D4ED8] border border-[#1D4ED8]/20'
                                  : 'bg-[#F4F6F9] text-[#556376] border border-[#EAEFF4]'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              <span>{u.role}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <select
                              value={u.role}
                              disabled={roleMutation.isPending}
                              onChange={(e) =>
                                roleMutation.mutate({
                                  userId: u.id,
                                  role: e.target.value as any,
                                })
                              }
                              className="bg-[#F4F6F9] border border-[#EAEFF4] rounded-xl px-3 py-1.5 text-xs text-[#1E2538] font-semibold focus:outline-none focus:border-[#135846] cursor-pointer"
                            >
                              <option value="customer">Customer (Guest)</option>
                              <option value="staff">Staff (Front Desk)</option>
                              <option value="super_admin">Super Admin (Executive)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ROOMS & NIGHTLY RATES CRUD */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1E2538]">
                  Room Inventory & Nightly Base Rates (₦)
                </h3>
                <p className="text-xs text-[#818E9B]">
                  Direct CRUD authority over nightly room rates in Nigerian Naira (₦) and instant operational availability locking.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left text-sm text-[#556376]">
                <thead className="text-[11px] uppercase tracking-wider text-[#818E9B] bg-[#F9FAFC] border-y border-[#EAEFF4]">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Room & Floor</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Current Nightly Rate (₦)</th>
                    <th className="py-3 px-4 font-semibold">Availability Status</th>
                    <th className="py-3 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEFF4]">
                  {isLoadingRooms ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[#818E9B]">
                        Loading room inventory...
                      </td>
                    </tr>
                  ) : (
                    rooms?.map((r: AdminRoom) => {
                      const isEditing = editingRoom?.id === r.id;
                      const priceVal = isEditing ? editingRoom.price : parseFloat(String(r.base_price_per_night || 180000));
                      const isAvail = isEditing ? editingRoom.is_available : r.status === 'available';

                      return (
                        <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-sm text-[#1E2538]">
                            #{r.room_number} (Floor {r.floor})
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#1E2538]">
                            {r.room_type_name}
                          </td>
                          <td className="py-3.5 px-4 font-serif font-bold text-[#135846]">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">₦</span>
                                <input
                                  type="number"
                                  value={priceVal}
                                  onChange={(e) =>
                                    setEditingRoom({
                                      ...editingRoom!,
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-32 bg-white border border-[#135846] rounded-lg px-2 py-1 text-xs text-[#1E2538]"
                                />
                              </div>
                            ) : (
                              formatCurrency(r.base_price_per_night || 180000)
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isEditing ? (
                              <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={isAvail}
                                  onChange={(e) =>
                                    setEditingRoom({
                                      ...editingRoom!,
                                      is_available: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 text-[#135846] rounded"
                                />
                                <span>{isAvail ? 'Available' : 'Locked / Maintenance'}</span>
                              </label>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  r.status === 'available'
                                    ? 'bg-[#E8F8F0] text-[#135846]'
                                    : 'bg-[#FFEBEB] text-[#FE5757]'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                <span>{r.status}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    roomRateMutation.mutate({
                                      roomId: r.id,
                                      price: editingRoom!.price,
                                      is_available: editingRoom!.is_available,
                                    })
                                  }
                                  disabled={roomRateMutation.isPending}
                                  className="px-3 py-1.5 rounded-xl bg-[#135846] text-white text-xs font-semibold shadow-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingRoom(null)}
                                  className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingRoom({
                                    id: r.id,
                                    price: parseFloat(String(r.base_price_per_night || 180000)),
                                    is_available: r.status === 'available',
                                  })
                                }
                                className="px-3 py-1.5 rounded-xl bg-[#F4F6F9] hover:bg-[#EAEFF4] text-[#135846] text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Rate</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
