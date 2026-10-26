'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bed, RefreshCw, CheckCircle, AlertCircle, Wrench, Sparkles, Filter } from 'lucide-react';
import { fetchAdminRooms, updateRoomStatus, AdminRoom } from '../../../../lib/api';
import { formatCurrency } from '../../../../lib/utils';

export default function RoomInventoryPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: rooms, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => fetchAdminRooms(),
  });

  const roomMutation = useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: any }) =>
      updateRoomStatus(roomId, status),
    onSuccess: (_, variables) => {
      setNotification({
        type: 'success',
        message: `Room status successfully updated to "${variables.status}".`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Failed to update room status' });
      setTimeout(() => setNotification(null), 4000);
    },
  });

  const filteredRooms = rooms?.filter((room) => {
    if (statusFilter === 'all') return true;
    return room.status === statusFilter;
  }) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
            Physical Inventory
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Room Grid & Maintenance
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-light mt-1">
            Toggle room operational states between available, occupied, housekeeping, and maintenance.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-hotel-gold' : ''}`} />
          <span>Refresh Grid</span>
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

      {/* Main Container */}
      <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Controls / Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-gray-400">Filter By Status:</span>
            {['all', 'available', 'occupied', 'maintenance', 'cleaning'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-colors ${
                  statusFilter === statusKey
                    ? 'bg-hotel-gold text-hotel-dark font-bold'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {statusKey}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400">
            Total Displayed: <strong className="text-white">{filteredRooms.length} Rooms</strong>
          </div>
        </div>

        {/* Room Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10 bg-white/5">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Room & Floor</th>
                <th className="py-3.5 px-4 font-semibold">Suite Classification</th>
                <th className="py-3.5 px-4 font-semibold">Max Occupancy</th>
                <th className="py-3.5 px-4 font-semibold">Nightly Base Rate</th>
                <th className="py-3.5 px-4 font-semibold">Operational Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Quick Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    Loading physical room inventory...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No rooms found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room: AdminRoom) => {
                  return (
                    <tr key={room.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Room Number & Floor */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-white text-base">
                            #{room.room_number}
                          </span>
                          <div>
                            <div className="font-semibold text-white">Room {room.room_number}</div>
                            <div className="text-xs text-gray-500">Floor {room.floor}</div>
                          </div>
                        </div>
                      </td>

                      {/* Suite Classification */}
                      <td className="py-4 px-4 font-medium text-white">
                        {room.room_type_name}
                      </td>

                      {/* Occupancy */}
                      <td className="py-4 px-4 text-xs text-gray-300">
                        {room.max_occupancy} Guests
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-serif font-bold text-hotel-gold">
                        {formatCurrency(room.base_price_per_night)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            room.status === 'available'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : room.status === 'occupied'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : room.status === 'maintenance'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : room.status === 'cleaning'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {room.status}
                        </span>
                      </td>

                      {/* Dropdown Toggle */}
                      <td className="py-4 px-4 text-right">
                        <select
                          value={room.status}
                          disabled={roomMutation.isPending}
                          onChange={(e) =>
                            roomMutation.mutate({
                              roomId: room.id,
                              status: e.target.value as any,
                            })
                          }
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-hotel-gold cursor-pointer [color-scheme:dark]"
                        >
                          <option value="available" className="bg-[#0F1626]">Set Available</option>
                          <option value="occupied" className="bg-[#0F1626]">Set Occupied</option>
                          <option value="maintenance" className="bg-[#0F1626]">Set Maintenance</option>
                          <option value="cleaning" className="bg-[#0F1626]">Set Cleaning</option>
                          <option value="out_of_order" className="bg-[#0F1626]">Set Out of Order</option>
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
    </div>
  );
}
