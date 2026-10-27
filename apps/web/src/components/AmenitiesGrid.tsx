'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Waves, Utensils, Sparkles, Shield, Briefcase, Car } from 'lucide-react';
import { fetchPublicSettings } from '../lib/api';

const ICON_MAP: Record<string, React.ElementType> = {
  Waves,
  Utensils,
  Sparkles,
  Shield,
  Briefcase,
  Car,
};

const DEFAULT_AMENITIES = [
  {
    icon: 'Waves',
    title: 'Rooftop Skyline Oasis Pool',
    description: 'Heated panoramic rooftop pool perched overlooking the Maiduguri skyline, featuring a signature mocktail & juice lounge with private cabanas.',
  },
  {
    icon: 'Utensils',
    title: 'Al-Maida Royal & International Dining',
    description: 'Three distinct culinary venues led by world-acclaimed chefs, serving authentic Northern delicacies (Suya, Kilishi, Masa, Tuwo Shinkafa) alongside Mediterranean and International fine dining.',
  },
  {
    icon: 'Sparkles',
    title: 'El-Kanemi Sanctuary Wellness Spa',
    description: 'Holistic rejuvenation featuring herbal hydrotherapy, eucalyptus steam rooms, Swedish massages, and certified wellness therapists.',
  },
  {
    icon: 'Shield',
    title: '24/7 Executive Security & White-Glove Concierge',
    description: 'Armed escort assistance, armored vehicle options, bespoke itinerary planning, private cultural tours of Maiduguri, and flight arrangements at Maiduguri International Airport (MIU).',
  },
  {
    icon: 'Briefcase',
    title: 'Presidential Boardrooms & Event Center',
    description: 'Acoustically isolated conference suites equipped with fiber-optic videoconferencing, simultaneous interpretation facilities, and tailored banquet catering.',
  },
  {
    icon: 'Car',
    title: 'Chauffeur & Airport Shuttle Fleet',
    description: 'Seamless arrival and departure transfers from Maiduguri International Airport in our fleet of premium Toyota Land Cruisers, Mercedes-Benz, and luxury SUVs.',
  },
];

export function AmenitiesGrid() {
  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => fetchPublicSettings(),
    staleTime: 1000 * 60 * 5,
  });

  const section = siteSettings?.amenities_section;
  const items = (section?.items && section.items.length > 0) ? section.items : DEFAULT_AMENITIES;

  return (
    <section id="amenities" className="py-24 bg-[#080C15] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
            {section?.subtitle || 'Curated Amenities & Services'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            {section?.title || 'World-Class Security & Authentic Northern Elegance'}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base font-light">
            {section?.description || 'Every detail at City Star Hotel is engineered to provide an unparalleled sanctuary of comfort, security, and prestige.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((amenity, idx) => {
            const Icon = (amenity.icon && ICON_MAP[amenity.icon]) || Sparkles;
            return (
              <div
                key={idx}
                className="bg-[#0F1626] border border-white/10 rounded-3xl p-8 hover:border-hotel-gold/40 transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] group"
              >
                <div className="w-14 h-14 rounded-2xl bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-hotel-gold group-hover:text-hotel-dark text-hotel-gold transition-all duration-300">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-hotel-gold-light transition-colors">
                  {amenity.title}
                </h3>
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  {amenity.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
