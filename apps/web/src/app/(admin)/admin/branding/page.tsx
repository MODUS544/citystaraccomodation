'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Eye,
  RefreshCw,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Layers,
  Star,
  Award,
  ShieldCheck,
  Compass,
  Waves,
  Utensils,
  Shield,
  Briefcase,
  Car,
  BedDouble,
  MessageSquare,
  Edit3,
  Save,
  FileText,
  X,
  Sliders,
} from 'lucide-react';
import Image from 'next/image';
import {
  fetchAdminSettings,
  updateSiteSetting,
  uploadDirectAsset,
  fetchRoomTypes,
  updateRoomType,
} from '../../../../lib/api';
import {
  BrandLogoSetting,
  HeroBannerSetting,
  AccoladeItem,
  ExperienceStorySetting,
  AmenitiesSectionSetting,
  GalleryImageSetting,
  TestimonialsSectionSetting,
  ContactInfoSetting,
  RoomType,
} from '../../../../types';
import { PaymentReceipt } from '../../../../components/PaymentReceipt';

const GALLERY_CATEGORIES = [
  { id: 'suites', label: 'Suites & Penthouses' },
  { id: 'dining', label: 'Culinary & Lounge' },
  { id: 'pool', label: 'Skyline Pool & Spa' },
  { id: 'lobby', label: 'Grand Royal Lobby' },
  { id: 'security', label: 'VIP Security & Fleet' },
  { id: 'general', label: 'General Architecture' },
];

export default function BrandingCMSPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'hero' | 'accolades' | 'suites' | 'story' | 'amenities' | 'gallery' | 'testimonials' | 'logo' | 'contact'
  >('hero');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Queries
  const { data: settings, isLoading: isLoadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => fetchAdminSettings(),
  });

  const { data: roomTypes, isLoading: isLoadingRooms, refetch: refetchRooms } = useQuery({
    queryKey: ['room-types'],
    queryFn: () => fetchRoomTypes(),
  });

  // Local Form States
  // 1. Hero
  const [heroState, setHeroState] = useState<HeroBannerSetting>({
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85',
    headline: 'Maiduguri’s Premier 5-Star Peace & Elegance',
    subheadline: 'Immerse yourself in bespoke Northern hospitality, panoramic views of the historic Kanem-Borno landscape, and world-class Kanuri & international culinary masterpieces in the heart of Maiduguri.',
    badge_text: 'Maiduguri’s Premier 5-Star Sanctuary',
    cta_text: 'Check Availability',
  });

  // 2. Accolades
  const [accoladesState, setAccoladesState] = useState<AccoladeItem[]>([
    { icon: 'Award', title: 'West African Luxury Hospitality Award 2026' },
    { icon: 'ShieldCheck', title: 'Forbes 5-Star Certified Luxury Resort' },
    { icon: 'Star', title: 'Royal Kanem Guide Recognized Fine Dining' },
    { icon: 'Compass', title: 'Prime Maiduguri Metropolitan Location (Secure VIP Zone)' },
  ]);

  // 3. Suites (local editing copy)
  const [suitesState, setSuitesState] = useState<RoomType[]>([]);
  const [newSuiteImageUrl, setNewSuiteImageUrl] = useState<Record<string, string>>({});

  // 4. Borno Story
  const [storyState, setStoryState] = useState<ExperienceStorySetting>({
    subtitle: 'The Heritage & Standard',
    title: 'Where Timeless Borno Splendor Meets Modern Luxury',
    description: 'Conceived as a tribute to Northern hospitality and modern elegance, City Star Hotel offers an intuitive retreat for global tastemakers, government dignitaries, NGO executives, and discerning travelers.',
    image_url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    image_badge: 'Bespoke Experience',
    image_title: 'Skyline Presidential & Royal Living',
    stats: [
      { value: '140+', label: 'Luxury Rooms & Royal Suites' },
      { value: '99.8%', label: 'Guest Satisfaction Rate' },
      { value: '100%', label: 'World-Class Secure Hospitality' },
    ],
  });

  // 5. Curated Amenities
  const [amenitiesState, setAmenitiesState] = useState<AmenitiesSectionSetting>({
    subtitle: 'Curated Amenities & Services',
    title: 'World-Class Security & Authentic Northern Elegance',
    description: 'Every detail at City Star Hotel is engineered to provide an unparalleled sanctuary of comfort, security, and prestige.',
    items: [
      {
        id: 'pool',
        icon: 'Waves',
        title: 'Rooftop Skyline Oasis Pool',
        description: 'Heated panoramic rooftop pool perched overlooking the Maiduguri skyline, featuring a signature mocktail & juice lounge with private cabanas.',
      },
      {
        id: 'dining',
        icon: 'Utensils',
        title: 'Al-Maida Royal & International Dining',
        description: 'Three distinct culinary venues led by world-acclaimed chefs, serving authentic Northern delicacies (Suya, Kilishi, Masa, Tuwo Shinkafa) alongside Mediterranean and International fine dining.',
      },
      {
        id: 'spa',
        icon: 'Sparkles',
        title: 'El-Kanemi Sanctuary Wellness Spa',
        description: 'Holistic rejuvenation featuring herbal hydrotherapy, eucalyptus steam rooms, Swedish massages, and certified wellness therapists.',
      },
      {
        id: 'security',
        icon: 'Shield',
        title: '24/7 Executive Security & White-Glove Concierge',
        description: 'Armed escort assistance, armored vehicle options, bespoke itinerary planning, private cultural tours of Maiduguri, and flight arrangements at Maiduguri International Airport (MIU).',
      },
      {
        id: 'boardrooms',
        icon: 'Briefcase',
        title: 'Presidential Boardrooms & Event Center',
        description: 'Acoustically isolated conference suites equipped with fiber-optic videoconferencing, simultaneous interpretation facilities, and tailored banquet catering.',
      },
      {
        id: 'chauffeur',
        icon: 'Car',
        title: 'Chauffeur & Airport Shuttle Fleet',
        description: 'Seamless arrival and departure transfers from Maiduguri International Airport in our fleet of premium Toyota Land Cruisers, Mercedes-Benz, and luxury SUVs.',
      },
    ],
  });

  // 6. Showcase Gallery (Every Picture Editable)
  const [galleryState, setGalleryState] = useState<GalleryImageSetting[]>([]);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('all');
  const [newGalleryItem, setNewGalleryItem] = useState<{
    url: string;
    caption: string;
    category: string;
    is_featured: boolean;
  }>({
    url: '',
    caption: '',
    category: 'suites',
    is_featured: false,
  });

  // 7. Testimonials
  const [testimonialsState, setTestimonialsState] = useState<TestimonialsSectionSetting>({
    subtitle: 'Guest Testimonials',
    title: 'Voices of Prestige',
    description: 'Reflections from global leaders, diplomats, business executives, and families who call City Star their home in Maiduguri.',
    items: [
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
    ],
  });

  // 8. Brand Logo
  const [logoState, setLogoState] = useState<BrandLogoSetting>({
    url: '',
    alt_text: 'City Star Hotel & Suites Logo',
    site_title: 'CITY STAR HOTEL & SUITES',
    tag_line: 'Maiduguri’s Premier 5-Star Peace & Elegance',
  });

  // 9. Contact & Footer
  const [contactState, setContactState] = useState<ContactInfoSetting>({
    phone: '+234 906 868 6675',
    email: 'citystarmaiduguri@gmail.com',
    address: 'City Star Hotel & Restaurant, Yerwa/Yerima Road, Maiduguri, Borno State, Nigeria',
    whatsapp: '+2349068686675',
    brand_name: 'CITY STAR HOTEL & RESTAURANT',
    description: 'An iconic haven of modern luxury in Maiduguri, where rich Northern heritage blends effortlessly with state-of-the-art sophistication.',
    copyright: '© 2026 City Star Hotel & Suites, Maiduguri. All rights reserved.',
  });

  // Loading indicator for uploads
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      if (settings.brand_logo) setLogoState((prev) => ({ ...prev, ...settings.brand_logo }));
      if (settings.hero_banner) setHeroState((prev) => ({ ...prev, ...settings.hero_banner }));
      if (Array.isArray(settings.accolades) && settings.accolades.length > 0) {
        setAccoladesState(settings.accolades);
      }
      if (settings.experience_story) setStoryState((prev) => ({ ...prev, ...settings.experience_story }));
      if (settings.amenities_section) setAmenitiesState((prev) => ({ ...prev, ...settings.amenities_section }));
      if (settings.hotel_gallery) {
        if (Array.isArray(settings.hotel_gallery)) {
          setGalleryState(settings.hotel_gallery);
        } else if (Array.isArray(settings.hotel_gallery.images)) {
          setGalleryState(settings.hotel_gallery.images);
        }
      }
      if (settings.testimonials_section) setTestimonialsState((prev) => ({ ...prev, ...settings.testimonials_section }));
      if (settings.contact_info) setContactState((prev) => ({ ...prev, ...settings.contact_info }));
    }
  }, [settings]);

  // Sync rooms when loaded
  useEffect(() => {
    if (Array.isArray(roomTypes) && roomTypes.length > 0) {
      setSuitesState(roomTypes);
    }
  }, [roomTypes]);

  // Mutation helper for site_settings
  const saveSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => updateSiteSetting(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      setFeedback({
        type: 'success',
        message: `Successfully saved changes to ${variables.key.replace('_', ' ')}!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save changes.',
      });
    },
  });

  // Mutation helper for room type
  const saveRoomMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateRoomType(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      setFeedback({
        type: 'success',
        message: `Suite "${variables.payload.name || 'Room'}" updated successfully!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update suite.',
      });
    },
  });

  // Generic direct asset uploader
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    prefix: 'logos' | 'hero' | 'gallery' | 'suites' | 'story',
    onSuccess: (url: string) => void,
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    try {
      setIsUploading((prev) => ({ ...prev, [key]: true }));
      const res = await uploadDirectAsset(file, prefix);
      onSuccess(res.publicUrl);
      setFeedback({
        type: 'success',
        message: `Image successfully uploaded to hotel-assets storage bucket!`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to upload image.',
      });
    } finally {
      setIsUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const filteredGallery = galleryState.filter((img) =>
    selectedGalleryCategory === 'all' ? true : img.category === selectedGalleryCategory
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hotel-gold/10 border border-hotel-gold/30 text-hotel-gold text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>5-Star Content Management Studio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Brand, Media & Content CMS
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm font-light mt-1">
            Complete editorial control over every photo, text block, suite specification, and accolade on the live website.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => {
              refetchSettings();
              refetchRooms();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Data</span>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Website</span>
          </a>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Studio Navigation Tabs */}
      <div className="bg-[#0F1626] border border-white/10 rounded-2xl p-1.5 flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {[
          { id: 'hero', label: 'Hero & Header', icon: ImageIcon },
          { id: 'accolades', label: 'Accolades & Distinctions', icon: Award },
          { id: 'suites', label: 'Suites & Pictures', icon: BedDouble },
          { id: 'story', label: 'Borno Heritage & Story', icon: Building },
          { id: 'amenities', label: 'Curated Amenities', icon: Sparkles },
          { id: 'gallery', label: 'Showcase Gallery (Pictures)', icon: Layers },
          { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
          { id: 'logo', label: 'Brand Crest & Identity', icon: Star },
          { id: 'contact', label: 'Location & Footer', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-hotel-gold text-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO & HEADER */}
      {activeTab === 'hero' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Primary Visual & Greeting
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Hero Banner & Live Booking Header</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit the main background photograph, luxury badge, headline, subheadline, and booking button text.
            </p>
          </div>

          {/* Picture Preview & Replacement */}
          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
              Hero Background Picture
            </label>
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900 group">
              {heroState.image_url ? (
                <Image
                  src={heroState.image_url}
                  alt="Hero Banner Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs">No picture set</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                <span className="truncate max-w-md font-mono text-[11px] text-gray-300">
                  {heroState.image_url}
                </span>
                <span className="px-2 py-1 rounded bg-black/60 border border-white/20 text-hotel-gold">
                  Active Banner
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={heroState.image_url || ''}
                  onChange={(e) => setHeroState({ ...heroState, image_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold font-mono"
                />
              </div>
              <div>
                <label className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-hotel-gold/30 hover:bg-hotel-gold/10 text-hotel-gold text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading['hero'] ? 'Uploading...' : 'Upload New Picture'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, 'hero', (url) => setHeroState({ ...heroState, image_url: url }), 'hero')
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Text Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                Luxury Badge Text
              </label>
              <input
                type="text"
                value={heroState.badge_text || ''}
                onChange={(e) => setHeroState({ ...heroState, badge_text: e.target.value })}
                placeholder="Maiduguri’s Premier 5-Star Sanctuary"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                CTA Button Text
              </label>
              <input
                type="text"
                value={heroState.cta_text || ''}
                onChange={(e) => setHeroState({ ...heroState, cta_text: e.target.value })}
                placeholder="Check Availability"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                Hero Headline
              </label>
              <input
                type="text"
                value={heroState.headline || ''}
                onChange={(e) => setHeroState({ ...heroState, headline: e.target.value })}
                placeholder="Maiduguri’s Premier 5-Star Peace & Elegance"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                Hero Subheadline (Introductory Paragraph)
              </label>
              <textarea
                rows={3}
                value={heroState.subheadline || ''}
                onChange={(e) => setHeroState({ ...heroState, subheadline: e.target.value })}
                placeholder="Immerse yourself in bespoke Northern hospitality..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-hotel-gold leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'hero_banner', value: heroState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Hero Banner</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOLADES & DISTINCTIONS */}
      {activeTab === 'accolades' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Prestige Bar
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Accolades & Distinctions (Trust Bar)</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit the 4 accreditations displayed prominently beneath the hero section.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accoladesState.map((acc, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-hotel-gold font-bold">
                  <span>Accreditation #{index + 1}</span>
                  <select
                    value={acc.icon || 'Award'}
                    onChange={(e) => {
                      const updated = [...accoladesState];
                      updated[index].icon = e.target.value;
                      setAccoladesState(updated);
                    }}
                    className="bg-[#0A101D] border border-white/20 text-hotel-gold text-xs rounded-lg px-2 py-1"
                  >
                    <option value="Award">🏆 Award</option>
                    <option value="ShieldCheck">⭐ Shield / Certification</option>
                    <option value="Star">🍽️ Star / Dining</option>
                    <option value="Compass">📍 Compass / Location</option>
                    <option value="MapPin">📌 Map Pin</option>
                    <option value="Sparkles">✨ Sparkles</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={acc.title}
                  onChange={(e) => {
                    const updated = [...accoladesState];
                    updated[index].title = e.target.value;
                    setAccoladesState(updated);
                  }}
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'accolades', value: accoladesState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Accolades Bar</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SUITES & PICTURES (ROOM TYPES & ROOM IMAGES) */}
      {activeTab === 'suites' && (
        <div className="space-y-6">
          <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Accommodations Inventory
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Suites, Penthouses & Room Pictures</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit each room category’s title, description, nightly rate (₦), amenities, and manage all picture galleries for each suite.
            </p>
          </div>

          {suitesState.map((suite, suiteIndex) => (
            <div
              key={suite.id}
              className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wider text-hotel-gold font-bold">
                    Room Type #{suiteIndex + 1}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white">{suite.name}</h3>
                </div>
                <div className="font-mono text-sm text-hotel-gold font-bold">
                  ₦{new Intl.NumberFormat('en-NG').format(Number(suite.base_price_per_night || suite.basePrice || 0))} / night
                </div>
              </div>

              {/* Suite Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    Suite Name
                  </label>
                  <input
                    type="text"
                    value={suite.name}
                    onChange={(e) => {
                      const updated = [...suitesState];
                      updated[suiteIndex].name = e.target.value;
                      setSuitesState(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    Nightly Rate (₦ NGN)
                  </label>
                  <input
                    type="number"
                    value={Number(suite.base_price_per_night || suite.basePrice || 0)}
                    onChange={(e) => {
                      const updated = [...suitesState];
                      updated[suiteIndex].base_price_per_night = Number(e.target.value);
                      setSuitesState(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    Max Occupancy (Guests)
                  </label>
                  <input
                    type="number"
                    value={suite.max_occupancy || 2}
                    onChange={(e) => {
                      const updated = [...suitesState];
                      updated[suiteIndex].max_occupancy = Number(e.target.value);
                      setSuitesState(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={suite.description}
                    onChange={(e) => {
                      const updated = [...suitesState];
                      updated[suiteIndex].description = e.target.value;
                      setSuitesState(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                {/* Amenities editor */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    Amenities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(suite.amenities || []).join(', ')}
                    onChange={(e) => {
                      const updated = [...suitesState];
                      updated[suiteIndex].amenities = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      setSuitesState(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>
              </div>

              {/* Suite Pictures Manager */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase tracking-wider text-hotel-gold font-bold">
                    Suite Photo Gallery ({suite.images?.length || 0} pictures)
                  </label>
                  <span className="text-[11px] text-gray-400">
                    You can edit, replace, delete, or add pictures for this suite.
                  </span>
                </div>

                {/* Grid of Existing Photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(suite.images || []).map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-2 relative group">
                      <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-900">
                        <Image src={imgUrl} alt={`Photo ${imgIdx + 1}`} fill unoptimized className="object-cover" />
                        <button
                          onClick={() => {
                            const updated = [...suitesState];
                            updated[suiteIndex].images = updated[suiteIndex].images.filter((_, i) => i !== imgIdx);
                            setSuitesState(updated);
                          }}
                          title="Delete Picture"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit URL */}
                      <input
                        type="text"
                        value={imgUrl}
                        onChange={(e) => {
                          const updated = [...suitesState];
                          updated[suiteIndex].images[imgIdx] = e.target.value;
                          setSuitesState(updated);
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-hotel-gold font-mono"
                      />

                      {/* Replace with upload */}
                      <label className="w-full py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-medium cursor-pointer flex items-center justify-center gap-1 transition-colors">
                        <Upload className="w-3 h-3 text-hotel-gold" />
                        <span>{isUploading[`suite-${suite.id}-${imgIdx}`] ? 'Uploading...' : 'Replace Photo File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(
                              e,
                              'suites',
                              (url) => {
                                const updated = [...suitesState];
                                updated[suiteIndex].images[imgIdx] = url;
                                setSuitesState(updated);
                              },
                              `suite-${suite.id}-${imgIdx}`
                            )
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>

                {/* Add New Picture to this suite */}
                <div className="p-3 rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="Paste image URL to add..."
                    value={newSuiteImageUrl[suite.id] || ''}
                    onChange={(e) => setNewSuiteImageUrl({ ...newSuiteImageUrl, [suite.id]: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                  <button
                    onClick={() => {
                      const url = newSuiteImageUrl[suite.id]?.trim();
                      if (!url) return;
                      const updated = [...suitesState];
                      updated[suiteIndex].images = [...(updated[suiteIndex].images || []), url];
                      setSuitesState(updated);
                      setNewSuiteImageUrl({ ...newSuiteImageUrl, [suite.id]: '' });
                    }}
                    className="px-3 py-2 rounded-lg bg-hotel-gold text-hotel-dark font-bold text-xs uppercase"
                  >
                    Add URL
                  </button>
                  <label className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-hotel-gold" />
                    <span>Upload Picture File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'suites',
                          (url) => {
                            const updated = [...suitesState];
                            updated[suiteIndex].images = [...(updated[suiteIndex].images || []), url];
                            setSuitesState(updated);
                          },
                          `suite-new-${suite.id}`
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              {/* Save Button for Suite */}
              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() =>
                    saveRoomMutation.mutate({
                      id: suite.id,
                      payload: {
                        name: suite.name,
                        description: suite.description,
                        basePricePerNight: Number(suite.base_price_per_night || suite.basePrice || 0),
                        maxOccupancy: suite.max_occupancy,
                        amenities: suite.amenities,
                        images: suite.images,
                      },
                    })
                  }
                  disabled={saveRoomMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Suite Specifications</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: BORNO HERITAGE & STORY */}
      {activeTab === 'story' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Cultural Narrative
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">The Heritage & Standard Experience</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit the story section headline, narrative paragraph, mosaic picture, and the 3 key statistics.
            </p>
          </div>

          {/* Story Picture */}
          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
              Heritage Section Featured Picture
            </label>
            <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
              {storyState.image_url ? (
                <Image src={storyState.image_url} alt="Story Preview" fill unoptimized className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs">No picture set</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Image URL"
                value={storyState.image_url || ''}
                onChange={(e) => setStoryState({ ...storyState, image_url: e.target.value })}
                className="sm:col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold font-mono"
              />
              <label className="py-2.5 px-4 rounded-xl bg-white/5 border border-hotel-gold/30 hover:bg-hotel-gold/10 text-hotel-gold text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Picture</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, 'story', (url) => setStoryState({ ...storyState, image_url: url }), 'story')
                  }
                />
              </label>
            </div>
          </div>

          {/* Story Text Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Subtitle
              </label>
              <input
                type="text"
                value={storyState.subtitle || ''}
                onChange={(e) => setStoryState({ ...storyState, subtitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Picture Badge Text
              </label>
              <input
                type="text"
                value={storyState.image_badge || ''}
                onChange={(e) => setStoryState({ ...storyState, image_badge: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Main Headline
              </label>
              <input
                type="text"
                value={storyState.title || ''}
                onChange={(e) => setStoryState({ ...storyState, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Narrative Paragraph
              </label>
              <textarea
                rows={3}
                value={storyState.description || ''}
                onChange={(e) => setStoryState({ ...storyState, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-hotel-gold leading-relaxed"
              />
            </div>
          </div>

          {/* Stats Editor */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <label className="block text-xs uppercase tracking-wider text-hotel-gold font-bold">
              3 Key Metrics & Accreditations
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(storyState.stats || []).map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => {
                      const updated = [...(storyState.stats || [])];
                      updated[i].value = e.target.value;
                      setStoryState({ ...storyState, stats: updated });
                    }}
                    placeholder="140+"
                    className="w-full bg-[#0A101D] border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-hotel-gold"
                  />
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => {
                      const updated = [...(storyState.stats || [])];
                      updated[i].label = e.target.value;
                      setStoryState({ ...storyState, stats: updated });
                    }}
                    placeholder="Luxury Rooms"
                    className="w-full bg-[#0A101D] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-gray-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'experience_story', value: storyState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Heritage & Story</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: CURATED AMENITIES */}
      {activeTab === 'amenities' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Guest Services
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Curated Amenities & Services</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit the 6 hospitality features including Rooftop Oasis Pool, Al-Maida Dining, Spa, Security Escorts, and Airport Shuttle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Subtitle
              </label>
              <input
                type="text"
                value={amenitiesState.subtitle || ''}
                onChange={(e) => setAmenitiesState({ ...amenitiesState, subtitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={amenitiesState.title || ''}
                onChange={(e) => setAmenitiesState({ ...amenitiesState, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Description
              </label>
              <textarea
                rows={2}
                value={amenitiesState.description || ''}
                onChange={(e) => setAmenitiesState({ ...amenitiesState, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          {/* 6 Amenity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {(amenitiesState.items || []).map((amenity, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-hotel-gold font-bold">
                    Amenity #{idx + 1}
                  </span>
                  <select
                    value={amenity.icon || 'Sparkles'}
                    onChange={(e) => {
                      const updated = [...(amenitiesState.items || [])];
                      updated[idx].icon = e.target.value;
                      setAmenitiesState({ ...amenitiesState, items: updated });
                    }}
                    className="bg-[#0A101D] border border-white/20 text-hotel-gold text-xs rounded-lg px-2 py-1"
                  >
                    <option value="Waves">🏊 Pool (Waves)</option>
                    <option value="Utensils">🍲 Dining (Utensils)</option>
                    <option value="Sparkles">🧖 Spa (Sparkles)</option>
                    <option value="Shield">🛡️ Security (Shield)</option>
                    <option value="Briefcase">💼 Conference (Briefcase)</option>
                    <option value="Car">🚗 Chauffeur (Car)</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={amenity.title}
                  onChange={(e) => {
                    const updated = [...(amenitiesState.items || [])];
                    updated[idx].title = e.target.value;
                    setAmenitiesState({ ...amenitiesState, items: updated });
                  }}
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-hotel-gold"
                />

                <textarea
                  rows={3}
                  value={amenity.description}
                  onChange={(e) => {
                    const updated = [...(amenitiesState.items || [])];
                    updated[idx].description = e.target.value;
                    setAmenitiesState({ ...amenitiesState, items: updated });
                  }}
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-hotel-gold leading-relaxed"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'amenities_section', value: amenitiesState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Curated Amenities</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: SHOWCASE GALLERY (ALL PICTURES EDITABLE & DELETABLE) */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Visual Showcase
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Visual Showcase Gallery Manager</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit any photo in the showcase, upload replacement images, change captions and categories, or delete photos.
            </p>

            {/* Add New Photo Form */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <span className="text-xs uppercase tracking-wider text-hotel-gold font-bold block">
                + Add New Picture to Showcase
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <input
                    type="text"
                    placeholder="Image URL or upload below..."
                    value={newGalleryItem.url}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, url: e.target.value })}
                    className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Caption (e.g. Shehu Royal Suite)"
                    value={newGalleryItem.caption}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                    className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  />
                </div>
                <div>
                  <select
                    value={newGalleryItem.category}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                    className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold"
                  >
                    {GALLERY_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGalleryItem.is_featured}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, is_featured: e.target.checked })}
                    className="rounded border-white/20"
                  />
                  <span>Mark as Featured in VIP Showcase</span>
                </label>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-hotel-gold" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'gallery',
                          (url) => setNewGalleryItem((prev) => ({ ...prev, url })),
                          'new-gallery'
                        )
                      }
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (!newGalleryItem.url) return;
                      const newItem: GalleryImageSetting = {
                        id: `gal-${Date.now()}`,
                        url: newGalleryItem.url,
                        caption: newGalleryItem.caption || 'City Star Showcase',
                        category: newGalleryItem.category,
                        is_featured: newGalleryItem.is_featured,
                      };
                      setGalleryState([newItem, ...galleryState]);
                      setNewGalleryItem({ url: '', caption: '', category: 'suites', is_featured: false });
                    }}
                    className="px-4 py-2 rounded-xl bg-hotel-gold text-hotel-dark font-bold text-xs uppercase"
                  >
                    Add to Gallery
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Photos Grid */}
          <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-serif text-lg font-bold text-white">
                All Gallery Pictures ({galleryState.length} total)
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Filter category:</span>
                <select
                  value={selectedGalleryCategory}
                  onChange={(e) => setSelectedGalleryCategory(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-hotel-gold"
                >
                  <option value="all">All Photos</option>
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGallery.map((img) => (
                <div key={img.id} className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3 relative group">
                  {/* Photo thumbnail */}
                  <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-900">
                    <Image src={img.url} alt={img.caption || ''} fill unoptimized className="object-cover" />
                    <button
                      onClick={() => setGalleryState(galleryState.filter((g) => g.id !== img.id))}
                      title="Delete Picture"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {img.is_featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-hotel-gold text-hotel-dark font-bold text-[10px] uppercase">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Edit Caption */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Caption</label>
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => {
                        const updated = galleryState.map((g) => (g.id === img.id ? { ...g, caption: e.target.value } : g));
                        setGalleryState(updated);
                      }}
                      className="w-full bg-[#0A101D] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  {/* Edit URL */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 font-semibold mb-0.5">Picture URL</label>
                    <input
                      type="text"
                      value={img.url}
                      onChange={(e) => {
                        const updated = galleryState.map((g) => (g.id === img.id ? { ...g, url: e.target.value } : g));
                        setGalleryState(updated);
                      }}
                      className="w-full bg-[#0A101D] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono"
                    />
                  </div>

                  {/* Category and replace button */}
                  <div className="flex items-center gap-2">
                    <select
                      value={img.category}
                      onChange={(e) => {
                        const updated = galleryState.map((g) => (g.id === img.id ? { ...g, category: e.target.value } : g));
                        setGalleryState(updated);
                      }}
                      className="flex-1 bg-[#0A101D] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-hotel-gold"
                    >
                      {GALLERY_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>

                    <label className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium cursor-pointer flex items-center gap-1 transition-colors">
                      <Upload className="w-3 h-3 text-hotel-gold" />
                      <span>{isUploading[`gal-${img.id}`] ? '...' : 'Replace'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            'gallery',
                            (url) => {
                              const updated = galleryState.map((g) => (g.id === img.id ? { ...g, url } : g));
                              setGalleryState(updated);
                            },
                            `gal-${img.id}`
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => saveSettingMutation.mutate({ key: 'hotel_gallery', value: galleryState })}
                disabled={saveSettingMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Gallery Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: VOICES OF PRESTIGE (TESTIMONIALS) */}
      {activeTab === 'testimonials' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Social Proof
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Voices of Prestige (Guest Testimonials)</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Edit the testimonial section subtitle, title, description, and every leader review.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Subtitle
              </label>
              <input
                type="text"
                value={testimonialsState.subtitle || ''}
                onChange={(e) => setTestimonialsState({ ...testimonialsState, subtitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={testimonialsState.title || ''}
                onChange={(e) => setTestimonialsState({ ...testimonialsState, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Section Description
              </label>
              <textarea
                rows={2}
                value={testimonialsState.description || ''}
                onChange={(e) => setTestimonialsState({ ...testimonialsState, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          {/* Testimonial Cards */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            {(testimonialsState.items || []).map((t, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-hotel-gold font-bold">
                    Testimonial #{idx + 1}
                  </span>
                  <button
                    onClick={() => {
                      const updated = [...(testimonialsState.items || [])];
                      updated.splice(idx, 1);
                      setTestimonialsState({ ...testimonialsState, items: updated });
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Guest Name (e.g. Engr. Mustapha B.)"
                    value={t.name}
                    onChange={(e) => {
                      const updated = [...(testimonialsState.items || [])];
                      updated[idx].name = e.target.value;
                      setTestimonialsState({ ...testimonialsState, items: updated });
                    }}
                    className="bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-hotel-gold"
                  />
                  <input
                    type="text"
                    placeholder="Role / Organization (e.g. Infrastructure Consultant, Abuja)"
                    value={t.role}
                    onChange={(e) => {
                      const updated = [...(testimonialsState.items || [])];
                      updated[idx].role = e.target.value;
                      setTestimonialsState({ ...testimonialsState, items: updated });
                    }}
                    className="bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-hotel-gold focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Quote text..."
                  value={t.quote}
                  onChange={(e) => {
                    const updated = [...(testimonialsState.items || [])];
                    updated[idx].quote = e.target.value;
                    setTestimonialsState({ ...testimonialsState, items: updated });
                  }}
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-hotel-gold leading-relaxed"
                />
              </div>
            ))}

            <button
              onClick={() => {
                const newItem = {
                  name: 'Dignitary / Guest',
                  role: 'Executive, Abuja',
                  quote: 'Exceptional hospitality and peaceful ambiance in the heart of Maiduguri.',
                  rating: 5,
                };
                setTestimonialsState({
                  ...testimonialsState,
                  items: [...(testimonialsState.items || []), newItem],
                });
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-hotel-gold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Testimonial</span>
            </button>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'testimonials_section', value: testimonialsState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Testimonials</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: BRAND CREST & IDENTITY */}
      {activeTab === 'logo' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Brand Identity
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Brand Crest, Logo & Titles</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Configure the primary hotel insignia, site title, and royal tagline across the header and footer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="relative w-24 h-24 rounded-full border-2 border-hotel-gold/60 flex items-center justify-center bg-hotel-dark overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.25)] flex-shrink-0">
              {logoState.url ? (
                <Image src={logoState.url} alt="Logo" fill unoptimized className="object-cover p-1" />
              ) : (
                <Star className="w-12 h-12 text-hotel-gold fill-hotel-gold/20" />
              )}
            </div>

            <div className="space-y-2 flex-1 w-full">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                Brand Crest Image
              </label>
              <input
                type="text"
                placeholder="Custom logo image URL..."
                value={logoState.url}
                onChange={(e) => setLogoState({ ...logoState, url: e.target.value })}
                className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-hotel-gold font-mono"
              />
              <div className="flex gap-2">
                <label className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-hotel-gold" />
                  <span>Upload Logo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, 'logos', (url) => setLogoState({ ...logoState, url }), 'logo')
                    }
                  />
                </label>
                {logoState.url && (
                  <button
                    onClick={() => setLogoState({ ...logoState, url: '' })}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                  >
                    Reset to Default Crest
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Hotel Primary Title
              </label>
              <input
                type="text"
                value={logoState.site_title || ''}
                onChange={(e) => setLogoState({ ...logoState, site_title: e.target.value })}
                placeholder="CITY STAR HOTEL & SUITES"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={logoState.tag_line || ''}
                onChange={(e) => setLogoState({ ...logoState, tag_line: e.target.value })}
                placeholder="Maiduguri’s Premier 5-Star Peace & Elegance"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'brand_logo', value: logoState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Brand Identity</span>
            </button>
          </div>

          {/* Live Payment Receipt Preview */}
          <div className="pt-8 border-t border-white/10">
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
                Official Receipt Preview
              </span>
              <h3 className="font-serif text-xl font-bold text-white">Live Payment Receipt Format</h3>
              <p className="text-gray-400 text-xs font-light">
                Matches the exact official receipt given to guests online, at front-desk walk-in checkout, and on key card issuance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex justify-center">
              <PaymentReceipt
                receipt={{
                  receiptNo: 'CH.MAVBU (Sample)',
                  date: '2026-10-27',
                  guestName: 'Abdullahi Musa (Sample)',
                  roomNo: '204',
                  nights: 2,
                  roomRate: 50000,
                  accommodationTotal: 100000,
                  restaurantCharges: 12000,
                  totalAmount: 112000,
                  amountPaid: 112000,
                  balanceDue: 0,
                  paymentMethod: 'Bank transfer (sample)',
                  paymentStatus: 'PAID',
                  logoUrl: logoState.url || undefined,
                  watermarkNote: 'ILLUSTRATIVE SAMPLE — NOT A VALID PAYMENT RECEIPT',
                }}
                showActions={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: LOCATION, CONTACT & FOOTER */}
      {activeTab === 'contact' && (
        <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Contact & Footprint
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Location, Contact & Footer Details</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Update physical Yerwa address, telephone numbers, concierge email, WhatsApp, and copyright notice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Brand Display Name in Footer
              </label>
              <input
                type="text"
                value={contactState.brand_name || ''}
                onChange={(e) => setContactState({ ...contactState, brand_name: e.target.value })}
                placeholder="CITY STAR HOTEL & RESTAURANT"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Physical Hotel Address
              </label>
              <input
                type="text"
                value={contactState.address || ''}
                onChange={(e) => setContactState({ ...contactState, address: e.target.value })}
                placeholder="City Star Hotel & Restaurant, Yerwa/Yerima Road, Maiduguri, Borno State, Nigeria"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Concierge Phone / WhatsApp
              </label>
              <input
                type="text"
                value={contactState.phone || ''}
                onChange={(e) => setContactState({ ...contactState, phone: e.target.value })}
                placeholder="+234 906 868 6675"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                value={contactState.email || ''}
                onChange={(e) => setContactState({ ...contactState, email: e.target.value })}
                placeholder="citystarmaiduguri@gmail.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Footer Tagline / Short Description
              </label>
              <textarea
                rows={2}
                value={contactState.description || ''}
                onChange={(e) => setContactState({ ...contactState, description: e.target.value })}
                placeholder="An iconic haven of modern luxury in Maiduguri..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                Copyright Notice
              </label>
              <input
                type="text"
                value={contactState.copyright || ''}
                onChange={(e) => setContactState({ ...contactState, copyright: e.target.value })}
                placeholder="© 2026 City Star Hotel & Suites, Maiduguri. All rights reserved."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => saveSettingMutation.mutate({ key: 'contact_info', value: contactState })}
              disabled={saveSettingMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Location & Footer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
