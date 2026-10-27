'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeroSearch } from '../components/HeroSearch';
import { RoomCard } from '../components/RoomCard';
import { AmenitiesGrid } from '../components/AmenitiesGrid';
import { BookingModal } from '../components/BookingModal';
import { fetchRoomTypes, fetchPublicSettings } from '../lib/api';
import { RoomType } from '../types';
import { Star, ShieldCheck, Award, Sparkles, Compass, Camera } from 'lucide-react';
import Image from 'next/image';

const TESTIMONIALS = [
  {
    name: 'Elena Rostova',
    role: 'Architectural Director, Zurich',
    quote: 'The architectural symmetry, acoustically isolated suites, and attentive concierge made our stay at City Star unforgettable. The penthouse view is sheer perfection.',
    rating: 5,
  },
  {
    name: 'Marcus Vance',
    role: 'Managing Partner, London',
    quote: 'From the Maybach airport transfer to the Michelin-star dining room, every element exudes effortless sophistication. Our company’s preferred residence in the city.',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Tech Executive, San Francisco',
    quote: 'The seamless digital booking experience and zero friction check-in combined with world-class spa facilities made for a truly rejuvenating retreat.',
    rating: 5,
  },
];

export default function HomePage() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('all');

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['room-types'],
    queryFn: fetchRoomTypes,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => fetchPublicSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const rawGallery = siteSettings?.hotel_gallery;
  const galleryImages: any[] = Array.isArray(rawGallery)
    ? rawGallery
    : (rawGallery && 'images' in rawGallery && Array.isArray((rawGallery as any).images))
    ? (rawGallery as any).images
    : [];
  const filteredGallery = galleryImages.filter((img: any) =>
    galleryFilter === 'all' ? true : img.category === galleryFilter
  );

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
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-xs uppercase tracking-widest text-gray-400 font-medium">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-hotel-gold" />
            <span>Condé Nast Gold List 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-hotel-gold" />
            <span>Forbes 5-Star Certified Luxury</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-hotel-gold fill-hotel-gold" />
            <span>Michelin Guide Recognized Dining</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-hotel-gold" />
            <span>Prime Metropolitan Location</span>
          </div>
        </div>
      </section>

      {/* Featured Suites & Accommodations Section */}
      <section id="rooms" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
            Sanctuaries of Rest
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Bespoke Suites & Residencies
          </h2>
          <p className="text-gray-400 text-sm sm:text-base font-light">
            Each suite combines bespoke Italian furnishings, marble en-suites, and floor-to-ceiling vistas designed for absolute tranquility.
          </p>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Skeleton Loader
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
                  src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
                  alt="City Star Luxury Suite"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-hotel-gold/30 backdrop-blur-md mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-hotel-gold" />
                    <span className="text-[11px] uppercase tracking-wider text-hotel-gold font-medium">
                      Bespoke Experience
                    </span>
                  </div>
                  <h4 className="font-serif text-2xl font-bold text-white">
                    Skyline Presidential Living
                  </h4>
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block">
                The Heritage & Standard
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
                Where Timeless Splendor Meets Contemporary Precision
              </h2>
              <p className="text-gray-300 font-light leading-relaxed text-sm sm:text-base">
                Conceived as a tribute to cosmopolitan luxury, City Star Hotel offers an intuitive retreat for global tastemakers, dignitaries, and discerning travelers.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-hotel-gold">
                    140+
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">
                    Luxury Rooms & Suites
                  </div>
                </div>
                <div>
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-hotel-gold">
                    99.8%
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">
                    Guest Satisfaction Rate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Grid */}
      <AmenitiesGrid />

      {/* Curated Photography Showcase Gallery */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-24 bg-[#0A101D] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
                Visual Grandeur
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
                The City Star Visual Showcase
              </h2>
              <p className="text-gray-400 text-sm font-light">
                An intimate glimpse into our architectural symmetry, world-class suites, private lounges, and heated skyline pool.
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {[
                  { id: 'all', label: 'All Showcase' },
                  { id: 'suites', label: 'Suites & Penthouses' },
                  { id: 'dining', label: 'Culinary & Bar' },
                  { id: 'pool', label: 'Skyline Pool & Spa' },
                  { id: 'lobby', label: 'Grand Lobby' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setGalleryFilter(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                      galleryFilter === cat.id
                        ? 'bg-hotel-gold text-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredGallery.map((img: any) => (
                <div
                  key={img.id}
                  className="group relative h-72 rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-slate-900"
                >
                  <Image
                    src={img.url}
                    alt={img.caption || 'Hotel photo'}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-hotel-gold block mb-1">
                      {img.category}
                    </span>
                    <h4 className="font-serif text-base font-bold text-white leading-tight">
                      {img.caption}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guest Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
            Guest Testimonials
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Voices of Prestige
          </h2>
          <p className="text-gray-400 text-sm font-light">
            Reflections from leaders, artists, and families who call City Star their metropolitan home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#0F1626] border border-white/10 rounded-3xl p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-6 text-hotel-gold">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-hotel-gold" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm italic font-light leading-relaxed mb-8">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="font-serif font-bold text-white text-base">
                  {item.name}
                </div>
                <div className="text-xs text-hotel-gold font-medium mt-0.5">
                  {item.role}
                </div>
              </div>
            </div>
          ))}
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
