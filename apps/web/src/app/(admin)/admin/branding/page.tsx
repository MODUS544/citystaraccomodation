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
  ExperienceStorySetting,
  AmenitiesSectionSetting,
  ContactInfoSetting,
  RoomType,
  SuitesHeaderSetting,
} from '../../../../types';
import { PaymentReceipt } from '../../../../components/PaymentReceipt';

export default function BrandingCMSPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'hero' | 'suites' | 'story' | 'amenities' | 'logo' | 'contact'
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
    image_url: '/hero-main.jpg',
    headline: 'Feels Like Home, Service Like Royalty.',
    subheadline: 'Immerse yourself in bespoke Northern hospitality, panoramic views of the historic Kanem-Borno landscape, and world-class Kanuri & international culinary masterpieces in the heart of Maiduguri.',
    badge_text: 'CITY STAR RESTAURANTS & ACCOMODATION',
    cta_text: 'Check Availability',
  });

  // Suites Section Header Setting (Admin Editable)
  const [suitesHeaderState, setSuitesHeaderState] = useState<SuitesHeaderSetting>({
    subtitle: 'SANCTUARIES OF REST',
    title: 'Bespoke Suites & Cultural Residencies',
    description:
      'Each suite combines bespoke Italian furnishings, hand-carved Kanuri geometric woodwork, marble en-suites, and floor-to-ceiling vistas designed for absolute luxury and tranquility.',
  });

  // 2. Suites (local editing copy)
  const [suitesState, setSuitesState] = useState<RoomType[]>([]);
  const [newSuiteImageUrl, setNewSuiteImageUrl] = useState<Record<string, string>>({});

  // 4. Borno Story
  const [storyState, setStoryState] = useState<ExperienceStorySetting>({
    subtitle: 'The Heritage & Standard',
    title: 'Where Northern Tradition Meets Modern Distinction.',
    description: 'Conceived as a tribute to Northern hospitality and modern elegance, City Star Hotel offers an intuitive retreat for global tastemakers, government dignitaries, NGO executives, and discerning travelers.',
    image_url: '/experience-story.jpg',
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

  // 6. Brand Logo
  const [logoState, setLogoState] = useState<BrandLogoSetting>({
    url: '',
    alt_text: 'City Star Hotel & Suites Logo',
    site_title: 'CITY STAR HOTEL & SUITES',
    tag_line: 'Maiduguri’s Premier 5-Star Peace & Elegance',
  });

  // 7. Contact & Footer
  const [contactState, setContactState] = useState<ContactInfoSetting>({
    phone: '+234 906 868 6675',
    email: 'citystarmaiduguri20@gmail.com',
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
      if (settings.suites_header) setSuitesHeaderState((prev) => ({ ...prev, ...settings.suites_header }));
      if (settings.experience_story) setStoryState((prev) => ({ ...prev, ...settings.experience_story }));
      if (settings.amenities_section) setAmenitiesState((prev) => ({ ...prev, ...settings.amenities_section }));
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
    prefix: 'logos' | 'hero' | 'suites' | 'story',
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

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#135846] font-bold block mb-1">
            5-Star Content Management Studio
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E2538] tracking-tight">
            Brand, Media & Content CMS
          </h1>
          <p className="text-[#818E9B] text-xs sm:text-sm font-normal mt-1">
            Complete editorial control over every photo, text block, suite specification, and royal brand assets.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => {
              refetchSettings();
              refetchRooms();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#EAEFF4] text-xs font-semibold text-[#556376] hover:text-[#1E2538] hover:border-[#D1D9E2] shadow-sm hover:shadow transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#135846]" />
            <span>Sync Live Data</span>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#135846] hover:bg-[#0e4335] text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Website</span>
          </a>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 shadow-md ${
            feedback.type === 'success'
              ? 'bg-[#E8F8F0] border border-[#135846]/20 text-[#135846]'
              : 'bg-[#FFEBEB] border border-[#FE5757]/20 text-[#FE5757]'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 text-[#135846]" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FE5757]" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Studio Navigation Tabs (Travl Style) */}
      <div className="bg-white border border-[#EAEFF4] rounded-2xl p-1.5 flex gap-1 overflow-x-auto shadow-sm [scrollbar-width:none]">
        {[
          { id: 'hero', label: 'Hero & Header', icon: ImageIcon },
          { id: 'suites', label: 'Suites & Pictures', icon: BedDouble },
          { id: 'story', label: 'Borno Heritage & Story', icon: Building },
          { id: 'amenities', label: 'Curated Amenities', icon: Sparkles },
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
                  ? 'bg-[#135846] text-white shadow-sm font-bold'
                  : 'text-[#818E9B] hover:text-[#1E2538] hover:bg-[#F4F6F9]'
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

      {/* TAB 2: SUITES & PICTURES (ROOM TYPES, HEADER TEXTS & ROOM IMAGES) */}
      {activeTab === 'suites' && (
        <div className="space-y-6">
          <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
              Accommodations Inventory & Philosophy
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Suites, Penthouses & Room Pictures</h2>
            <p className="text-gray-400 text-xs font-light mt-1">
              Customize the section header texts, edit each room category’s title, description, nightly rate (₦), amenities, and manage all picture galleries for each suite.
            </p>
          </div>

          {/* Section Header Text Editor (SANCTUARIES OF REST / Bespoke Suites...) */}
          <div className="bg-[#0F1626] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
                Suites Section Title & Narrative
              </span>
              <h3 className="font-serif text-xl font-bold text-white">Homepage Section Header Texts</h3>
              <p className="text-gray-400 text-xs font-light mt-1">
                Customize the subtitle, main heading, and narrative description shown directly above the suite cards on the homepage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={suitesHeaderState.subtitle}
                  onChange={(e) => setSuitesHeaderState({ ...suitesHeaderState, subtitle: e.target.value })}
                  placeholder="SANCTUARIES OF REST"
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                  Section Heading / Title
                </label>
                <input
                  type="text"
                  value={suitesHeaderState.title}
                  onChange={(e) => setSuitesHeaderState({ ...suitesHeaderState, title: e.target.value })}
                  placeholder="Bespoke Suites & Cultural Residencies"
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold font-serif"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-hotel-gold font-semibold mb-1">
                  Narrative Description
                </label>
                <textarea
                  rows={3}
                  value={suitesHeaderState.description}
                  onChange={(e) => setSuitesHeaderState({ ...suitesHeaderState, description: e.target.value })}
                  placeholder="Each suite combines bespoke Italian furnishings, hand-carved Kanuri geometric woodwork, marble en-suites, and floor-to-ceiling vistas designed for absolute luxury and tranquility."
                  className="w-full bg-[#0A101D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-hotel-gold leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => saveSettingMutation.mutate({ key: 'suites_header', value: suitesHeaderState })}
                disabled={saveSettingMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Section Header Texts</span>
              </button>
            </div>
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

      {/* TAB 5: BRAND CREST & IDENTITY */}
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
              <div className="flex items-center gap-2">
                <label className="py-2 px-4 rounded-xl bg-hotel-gold/15 hover:bg-hotel-gold/25 border border-hotel-gold/30 text-hotel-gold text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all active:scale-95">
                  <Upload className="w-3.5 h-3.5 text-hotel-gold" />
                  <span>Upload Logo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        'logos',
                        (url) => {
                          const updated = { ...logoState, url };
                          setLogoState(updated);
                          saveSettingMutation.mutate({ key: 'brand_logo', value: updated });
                        },
                        'logo'
                      )
                    }
                  />
                </label>
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

          {/* Live Reservation Slip Preview */}
          <div className="pt-8 border-t border-white/10">
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-hotel-gold font-semibold block mb-1">
                Reservation Slip Preview
              </span>
              <h3 className="font-serif text-xl font-bold text-white">Live Reservation Slip Format</h3>
              <p className="text-gray-400 text-xs font-light">
                Matches the exact reservation slip given to guests online with official app payment instructions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex justify-center">
              <PaymentReceipt
                receipt={{
                  receiptNo: 'CH.TXOOQ (Sample)',
                  date: 'Oct 27, 2026',
                  guestName: 'Abdullahi Musa (Sample)',
                  nights: 2,
                  roomRate: 50000,
                  accommodationTotal: 100000,
                  totalAmount: 100000,
                  paymentStatus: 'CONFIRMED',
                  logoUrl: logoState.url || undefined,
                }}
                showActions={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LOCATION, CONTACT & FOOTER */}
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
