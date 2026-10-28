'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bed, RefreshCw, CheckCircle, AlertCircle, Wrench, Sparkles, Filter, ShieldCheck } from 'lucide-react';
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

  const filteredRooms = Array.isArray(rooms)
    ? rooms.filter((room) => {
        if (statusFilter === 'all') return true;
        return room.status === statusFilter;
      })
    : [];

  const availableCount = Array.isArray(rooms) ? rooms.filter(r => r.status === 'available').length : 0;
  const occupiedCount = Array.isArray(rooms) ? rooms.filter(r => r.status === 'occupied').length : 0;
  const maintenanceCount = Array.isArray(rooms) ? rooms.filter(r => r.status === 'maintenance').length : 0;
  const cleaningCount = Array.isArray(rooms) ? rooms.filter(r => r.status === 'cleaning').length : 0;

  return (
    <div className="space-y-8 animate-fade-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#135846] font-bold block mb-1">
            Physical Inventory
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538] tracking-tight">
            Room Grid & Housekeeping Controls
          </h1>
          <p className="text-[#818E9B] text-xs sm:text-sm font-normal mt-1">
            Toggle room operational states between available, occupied, housekeeping, and maintenance.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEFF4] text-xs font-semibold text-[#556376] hover:text-[#1E2538] hover:border-[#D1D9E2] shadow-sm hover:shadow transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#135846]' : 'text-[#818E9B]'}`} />
          <span>Refresh Grid</span>
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

      {/* Main Container */}
      <div className="bg-white border border-[#EAEFF4] rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6">
        {/* Underlined Filter Tabs (Travl Style) */}
        <div className="flex items-center justify-between gap-4 border-b border-[#EAEFF4] pb-px">
          <div className="flex items-center gap-6 overflow-x-auto text-sm">
            {[
              { id: 'all', label: `All Rooms (${rooms?.length || 0})` },
              { id: 'available', label: `Available (${availableCount})`, color: '#135846' },
              { id: 'occupied', label: `Occupied (${occupiedCount})`, color: '#1D4ED8' },
              { id: 'maintenance', label: `Maintenance (${maintenanceCount})`, color: '#FE5757' },
              { id: 'cleaning', label: `Housekeeping (${cleaningCount})`, color: '#D97706' },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`pb-3.5 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#135846] border-b-2 border-[#135846]'
                      : 'text-[#818E9B] hover:text-[#1E2538]'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[#818E9B] font-medium hidden sm:block">
            Showing <strong className="text-[#1E2538] font-bold">{filteredRooms.length}</strong> of {rooms?.length || 0} Suites
          </div>
        </div>

        {/* Room Grid Table */}
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full text-left text-sm text-[#556376]">
            <thead className="text-[11px] uppercase tracking-wider text-[#818E9B] bg-[#F9FAFC] border-y border-[#EAEFF4]">
              <tr>
                <th className="py-3.5 px-6 font-semibold">Room & Floor</th>
                <th className="py-3.5 px-4 font-semibold">Suite Classification</th>
                <th className="py-3.5 px-4 font-semibold">Max Occupancy</th>
                <th className="py-3.5 px-4 font-semibold">Nightly Base Rate</th>
                <th className="py-3.5 px-4 font-semibold">Operational Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Quick Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF4]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#818E9B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#135846]" />
                      <span>Loading physical room inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#818E9B]">
                    No rooms found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room: AdminRoom) => {
                  return (
                    <tr key={room.id} className="hover:bg-[#F8FAFC] transition-colors group">
                      {/* Room Number & Floor */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="w-11 h-11 rounded-2xl bg-[#F4F6F9] border border-[#EAEFF4] flex items-center justify-center font-mono font-bold text-[#1E2538] text-sm group-hover:border-[#135846]/40 transition-colors">
                            #{room.room_number}
                          </span>
                          <div>
                            <div className="font-semibold text-[#1E2538] group-hover:text-[#135846] transition-colors">
                              Room {room.room_number}
                            </div>
                            <div className="text-xs text-[#818E9B]">Floor {room.floor}</div>
                          </div>
                        </div>
                      </td>

                      {/* Suite Classification */}
                      <td className="py-4 px-4 font-medium text-[#1E2538]">
                        {room.room_type_name}
                      </td>

                      {/* Occupancy */}
                      <td className="py-4 px-4 text-xs text-[#556376]">
                        {room.max_occupancy} Guests
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-serif font-bold text-[#135846]">
                        {formatCurrency(room.base_price_per_night)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            room.status === 'available'
                              ? 'bg-[#E8F8F0] text-[#135846]'
                              : room.status === 'occupied'
                              ? 'bg-[#EBF4FF] text-[#1D4ED8]'
                              : room.status === 'maintenance'
                              ? 'bg-[#FFEBEB] text-[#FE5757]'
                              : room.status === 'cleaning'
                              ? 'bg-[#FFF8E6] text-[#D97706]'
                              : 'bg-[#F1F3F6] text-[#556376]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {room.status}
                        </span>
                      </td>

                      {/* Dropdown Toggle */}
                      <td className="py-4 px-6 text-right">
                        <select
                          value={room.status}
                          disabled={roomMutation.isPending}
                          onChange={(e) =>
                            roomMutation.mutate({
                              roomId: room.id,
                              status: e.target.value as any,
                            })
                          }
                          className="bg-[#F4F6F9] border border-[#EAEFF4] rounded-xl px-3 py-1.5 text-xs text-[#1E2538] font-semibold focus:outline-none focus:border-[#135846] hover:border-[#D1D9E2] cursor-pointer transition-colors"
                        >
                          <option value="available">Set Available</option>
                          <option value="occupied">Set Occupied</option>
                          <option value="maintenance">Set Maintenance</option>
                          <option value="cleaning">Set Cleaning</option>
                          <option value="out_of_order">Set Out of Order</option>
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
