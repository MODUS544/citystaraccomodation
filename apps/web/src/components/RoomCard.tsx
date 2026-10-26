'use client';

import React from 'react';
import Image from 'next/image';
import { Users, Wifi, Sparkles, ArrowRight } from 'lucide-react';
import { RoomType } from '../types';
import { formatCurrency } from '../lib/utils';

interface RoomCardProps {
  room: RoomType;
  onSelectRoom: (room: RoomType) => void;
}

export function RoomCard({ room, onSelectRoom }: RoomCardProps) {
  const imageUrl = room.images && room.images.length > 0
    ? room.images[0]
    : 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="group bg-[#0F1626] border border-white/10 rounded-3xl overflow-hidden hover:border-hotel-gold/50 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col h-full">
      {/* Image Container with Zoom */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={room.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1626] via-transparent to-transparent opacity-80" />

        {/* Occupancy Badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-medium text-white flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-hotel-gold" />
          <span>Up to {room.max_occupancy} Guests</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="font-serif text-2xl font-bold text-white group-hover:text-hotel-gold-light transition-colors">
              {room.name}
            </h3>
          </div>

          <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-light leading-relaxed">
            {room.description}
          </p>

          {/* Amenities Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {room.amenities.slice(0, 4).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-hotel-gold" />
                {amenity}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400">
                +{room.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Price & CTA */}
        <div className="pt-5 border-t border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gray-400">Nightly Rate</div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-hotel-gold">
                {formatCurrency(room.base_price_per_night)}
              </span>
              <span className="text-xs text-gray-400">/ night</span>
            </div>
          </div>

          <button
            onClick={() => onSelectRoom(room)}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-1.5 hover:gap-2"
          >
            <span>Reserve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
