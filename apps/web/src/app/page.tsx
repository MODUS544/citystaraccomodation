'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeroSearch } from '../components/HeroSearch';
import { RoomCard } from '../components/RoomCard';
import { AmenitiesGrid } from '../components/AmenitiesGrid';
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

const DEFAULT_TESTIMONIALS = [
  {
    name: 'Engr. Mustapha B.',
    role: 'Infrastructure Consultant, Abuja',
    quote: 'The architectural perfection, high-level security, acoustically isolated suites, and attentive concierge made our stay in Borno state truly unforgettable. The Penthouse view over Maiduguri is sheer perfection.',
    rating: 5,
  },
  {
    name: 'Dr. Claire Dupont',
    role: 'International Mission Director, Geneva',
    quote: 'From the seamless airport pickup to the traditional fine dining, every element exudes effortless sophistication. City Star is undeniably our organization’s preferred residence in Borno State.',
    rating: 5,
  },
  {
    name: 'Alh. Farouk Kyari',
    role: 'Managing Director, Lagos',
    quote: 'The high-speed fiber internet, tranquil spa, zero-friction check-in, and top-tier security made for a productive and deeply relaxing business trip.',
    rating: 5,
  },
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

  const story = siteSettings?.experience_story;
  const accolades = (siteSettings?.accolades && siteSettings.accolades.length > 0)
    ? siteSettings.accolades
    : DEFAULT_ACCOLADES;

  const rawGallery = siteSettings?.hotel_gallery;
  const galleryImages: any[] = Array.isArray(rawGallery)
    ? rawGallery
    : (rawGallery && 'images' in rawGallery && Array.isArray((rawGallery as any).images))
    ? (rawGallery as any).images
    : [];

  const filteredGallery = galleryImages.filter((img: any) =>
    galleryFilter === 'all' ? true : img.category === galleryFilter
  );

  const testimonialsSection = siteSettings?.testimonials_section;
  const testimonials = (testimonialsSection?.items && testimonialsSection.items.length > 0)
    ? testimonialsSection.items
    : DEFAULT_TESTIMONIALS;

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
                An intimate glimpse into our architectural symmetry, royal penthouses, private lounges, lush gardens, and skyline pool.
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {[
                  { id: 'all', label: 'All Showcase' },
                  { id: 'suites', label: 'Suites & Penthouses' },
                  { id: 'dining', label: 'Culinary & Lounge' },
                  { id: 'pool', label: 'Skyline Pool & Spa' },
                  { id: 'lobby', label: 'Grand Royal Lobby' },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

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
            {testimonialsSection?.subtitle || 'Guest Testimonials'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            {testimonialsSection?.title || 'Voices of Prestige'}
          </h2>
          <p className="text-gray-400 text-sm font-light">
            {testimonialsSection?.description ||
              'Reflections from global leaders, diplomats, business executives, and families who call City Star their home in Maiduguri.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#0F1626] border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-hotel-gold/30 transition-all"
            >
              <div>
                <div className="flex gap-1 mb-6 text-hotel-gold">
                  {[...Array(item.rating || 5)].map((_, i) => (
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
