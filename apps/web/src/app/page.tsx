'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeroSearch } from '../components/HeroSearch';
import { RoomCard } from '../components/RoomCard';
import { BookingModal } from '../components/BookingModal';
import { fetchRoomTypes, fetchPublicSettings } from '../lib/api';
import { RoomType } from '../types';
import { Star, ShieldCheck, Award, Sparkles, Compass, MapPin } from 'lucide-react';
import Image from 'next/image';

const DEFAULT_ACCOLADES = [
  { icon: 'Award', title: 'West African Luxury Hospitality Award 2026' },
  { icon: 'ShieldCheck', title: 'Forbes 5-Star Certified Luxury Resort' },
  { icon: 'Star', title: 'Royal Kanem Guide Recognized Fine Dining' },
  { icon: 'Compass', title: 'Prime Maiduguri Metropolitan Location (Secure VIP Zone)' },
];

const ACCOLADE_ICONS: Record<string, React.ElementType> = {
  Award,
  ShieldCheck,
  Star,
  Compass,
  MapPin,
  Sparkles,
};

export default function HomePage() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['room-types'],
    queryFn: fetchRoomTypes,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => fetchPublicSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const story = siteSettings?.experience_story;
  const accolades = (siteSettings?.accolades && siteSettings.accolades.length > 0)
    ? siteSettings.accolades
    : DEFAULT_ACCOLADES;

  const handleSelectRoom = (room: RoomType) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#080C15]">
      {/* Hero Section with Live Availability Search */}
      <HeroSearch />

      {/* Trust & Accreditations Banner */}
      <section className="border-y border-white/10 bg-[#0A101D] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-xs uppercase tracking-widest text-gray-300 font-semibold">
          {accolades.map((acc, i) => {
            const Icon = (acc.icon && ACCOLADE_ICONS[acc.icon]) || Award;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-hotel-gold flex-shrink-0" />
                <span className="tracking-wider">{acc.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Suites & Accommodations Section */}
      <section id="rooms" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
            Sanctuaries of Rest
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Bespoke Suites & Cultural Residencies
          </h2>
          <p className="text-gray-400 text-sm sm:text-base font-light">
            Each suite combines bespoke Italian furnishings, hand-carved Kanuri geometric woodwork, marble en-suites, and floor-to-ceiling vistas designed for absolute luxury and tranquility.
          </p>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#0F1626] border border-white/10 rounded-3xl h-96 animate-pulse p-6"
              />
            ))
          ) : (
            rooms?.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelectRoom={handleSelectRoom}
              />
            ))
          )}
        </div>
      </section>

      {/* The City Star Experience Section */}
      <section id="experience" className="py-24 bg-[#0A101D] border-y border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual Mosaic */}
            <div className="relative">
              <div className="relative h-[480px] sm:h-[550px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src={story?.image_url || 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'}
                  alt="City Star Luxury Suite"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-hotel-gold/30 backdrop-blur-md mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-hotel-gold" />
                    <span className="text-[11px] uppercase tracking-wider text-hotel-gold font-medium">
                      {story?.image_badge || 'Bespoke Experience'}
                    </span>
                  </div>
                  <h4 className="font-serif text-2xl font-bold text-white">
                    {story?.image_title || 'Skyline Presidential & Royal Living'}
                  </h4>
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block">
                {story?.subtitle || 'The Heritage & Standard'}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
                {story?.title || 'Where Timeless Borno Splendor Meets Modern Luxury'}
              </h2>
              <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base">
                {story?.description ||
                  'Conceived as a tribute to Northern hospitality and modern elegance, City Star Hotel offers an intuitive retreat for global tastemakers, government dignitaries, NGO executives, and discerning travelers.'}
              </p>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                {(story?.stats || [
                  { value: '140+', label: 'Luxury Rooms & Royal Suites' },
                  { value: '99.8%', label: 'Guest Satisfaction Rate' },
                  { value: '100%', label: 'World-Class Secure Hospitality' },
                ]).map((stat, i) => (
                  <div key={i}>
                    <div className="font-serif text-2xl sm:text-4xl font-bold text-hotel-gold">
                      {stat.value}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reservation Modal */}
      <BookingModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
