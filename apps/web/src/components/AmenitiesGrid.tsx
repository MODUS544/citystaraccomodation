'use client';

import React from 'react';
import { Waves, Utensils, Sparkles, Clock, Briefcase, Car } from 'lucide-react';

const AMENITIES = [
  {
    icon: Waves,
    title: 'Infinity Skyline Pool',
    description: 'Heated panoramic rooftop pool perched on the 28th floor with signature cocktail bar and private cabanas.',
  },
  {
    icon: Utensils,
    title: 'Michelin-Caliber Dining',
    description: 'Three distinct culinary venues led by world-acclaimed chefs, featuring an extensive sommelier wine cellar.',
  },
  {
    icon: Sparkles,
    title: 'Sanctuary Wellness Spa',
    description: 'Holistic rejuvenation with hydrotherapy baths, steam rooms, Swedish massages, and certified therapists.',
  },
  {
    icon: Clock,
    title: '24/7 White-Glove Concierge',
    description: 'Bespoke itinerary planning, private theatre bookings, and priority access to premier city attractions.',
  },
  {
    icon: Briefcase,
    title: 'Executive Boardrooms',
    description: 'Acoustically isolated conference suites with fiber-optic videoconferencing and tailored catering.',
  },
  {
    icon: Car,
    title: 'Chauffeur Airport Fleet',
    description: 'Seamless arrival and departure transfers in our fleet of premium Mercedes-Maybach and Rolls-Royce vehicles.',
  },
];

export function AmenitiesGrid() {
  return (
    <section id="amenities" className="py-24 bg-[#080C15] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-2">
            World-Class Hospitality
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mb-4">
            Curated Amenities & Services
          </h2>
          <p className="text-gray-400 text-sm sm:text-base font-light">
            Every detail at City Star Hotel is engineered to provide an unparalleled sanctuary of comfort and prestige.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {AMENITIES.map((amenity, idx) => {
            const Icon = amenity.icon;
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
