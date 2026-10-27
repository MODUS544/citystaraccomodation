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
  Sliders,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Layers,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import {
  fetchAdminSettings,
  updateSiteSetting,
  uploadDirectAsset,
} from '../../../../lib/api';
import {
  BrandLogoSetting,
  HeroBannerSetting,
  GalleryImageSetting,
  ContactInfoSetting,
} from '../../../../types';

const GALLERY_CATEGORIES = [
  { id: 'all', label: 'All Photos' },
  { id: 'suites', label: 'Suites & Rooms' },
  { id: 'dining', label: 'Dining & Lounge' },
  { id: 'pool', label: 'Pool & Spa' },
  { id: 'lobby', label: 'Lobby & Architecture' },
  { id: 'gym', label: 'Fitness & Wellness' },
];

export default function BrandingCMSPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'logo' | 'hero' | 'gallery' | 'contact'>('logo');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Queries
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => fetchAdminSettings(),
  });

  // Local form states
  const [logoState, setLogoState] = useState<BrandLogoSetting>({
    url: '',
    alt_text: 'City Star Hotel & Suites Logo',
    site_title: 'City Star Hotel',
    tag_line: 'Luxury Hotel & Suites',
  });

  const [heroState, setHeroState] = useState<HeroBannerSetting>({
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85',
    headline: 'Elegance Redefined, Luxury Realized',
    subheadline: 'Immerse yourself in bespoke hospitality, panoramic skyline vistas, and world-class culinary masterpieces in the heart of the metropolis.',
    cta_text: 'Reserve a Suite',
  });

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
  const [isAddingGalleryItem, setIsAddingGalleryItem] = useState(false);

  const [contactState, setContactState] = useState<ContactInfoSetting>({
    phone: '+1 (800) 248-9782',
    email: 'concierge@citystarhotel.com',
    address: '450 Grand Star Boulevard, Metropolitan Center',
    social_links: {
      instagram: 'https://instagram.com/citystarhotel',
      twitter: 'https://x.com/citystarhotel',
    },
  });

  // Uploading flags
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      if (settings.brand_logo) setLogoState(settings.brand_logo);
      if (settings.hero_banner) setHeroState(settings.hero_banner);
      if (settings.hotel_gallery) {
        if (Array.isArray(settings.hotel_gallery)) {
          setGalleryState(settings.hotel_gallery);
        } else if (Array.isArray(settings.hotel_gallery.images)) {
          setGalleryState(settings.hotel_gallery.images);
        }
      }
      if (settings.contact_info) setContactState(settings.contact_info);
    }
  }, [settings]);

  // Mutation helper
  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      updateSiteSetting(key, value),
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
        message: err.response?.data?.error?.message || err.message || 'Failed to save changes.',
      });
    },
  });

  // Upload handler helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    prefix: 'logos' | 'hero' | 'gallery',
    onSuccess: (url: string) => void,
    setLoading: (l: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    try {
      setLoading(true);
      const res = await uploadDirectAsset(file, prefix);
      onSuccess(res.publicUrl);
      setFeedback({
        type: 'success',
        message: `Image successfully uploaded to hotel-assets storage bucket!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Asset upload error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || err.message || 'Asset upload failed.',
      });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSaveLogo = () => {
    saveMutation.mutate({ key: 'brand_logo', value: logoState });
  };

  const handleSaveHero = () => {
    saveMutation.mutate({ key: 'hero_banner', value: heroState });
  };

  const handleSaveGallery = (updatedList?: GalleryImageSetting[]) => {
    const imagesToSave = updatedList || galleryState;
    saveMutation.mutate({
      key: 'hotel_gallery',
      value: { images: imagesToSave },
    });
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryItem.url.trim()) {
      alert('Please provide an image URL or upload an asset.');
      return;
    }
    const newItem: GalleryImageSetting = {
      id: `img-${Date.now()}`,
      url: newGalleryItem.url,
      caption: newGalleryItem.caption || 'Hotel Feature',
      category: newGalleryItem.category,
      is_featured: newGalleryItem.is_featured,
    };
    const updated = [newItem, ...galleryState];
    setGalleryState(updated);
    setNewGalleryItem({ url: '', caption: '', category: 'suites', is_featured: false });
    setIsAddingGalleryItem(false);
    handleSaveGallery(updated);
  };

  const handleDeleteGalleryImage = (id: string) => {
    const updated = galleryState.filter((img) => img.id !== id);
    setGalleryState(updated);
    handleSaveGallery(updated);
  };

  const handleToggleFeatured = (id: string) => {
    const updated = galleryState.map((img) =>
      img.id === id ? { ...img, is_featured: !img.is_featured } : img
    );
    setGalleryState(updated);
    handleSaveGallery(updated);
  };

  const handleSaveContact = () => {
    saveMutation.mutate({ key: 'contact_info', value: contactState });
  };

  const filteredGallery = galleryState.filter((item) =>
    selectedGalleryCategory === 'all' ? true : item.category === selectedGalleryCategory
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-hotel-gold/10 text-hotel-gold border border-hotel-gold/20">
              Super Admin Content Management
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Media & Brand CMS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Control the public brand identity, hero banner, showcase media gallery, and concierge contact points.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload Content</span>
          </button>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hotel-gold/10 hover:bg-hotel-gold/20 border border-hotel-gold/30 text-xs font-semibold text-hotel-gold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Live Site</span>
          </a>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'logo', label: 'Brand & Crest Identity', icon: Star },
          { id: 'hero', label: 'Hero Showcase Banner', icon: Sparkles },
          { id: 'gallery', label: 'Showcase Media Gallery', icon: ImageIcon },
          { id: 'contact', label: 'Concierge & Contact Info', icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Brand & Crest Identity */}
      {activeTab === 'logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Brand Logo & Crest</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Upload an image logo or configure the custom vector brand crest for the navigation bar and footer.
                </p>
              </div>

              {/* Upload or URL */}
              <div className="space-y-4">
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                  Logo Image File (Upload to Supabase Storage)
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors">
                    <Upload className="w-4 h-4 text-hotel-gold" />
                    <span>{isUploadingLogo ? 'Uploading...' : 'Choose File to Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'logos',
                          (url) => setLogoState((prev) => ({ ...prev, url })),
                          setIsUploadingLogo
                        )
                      }
                    />
                  </label>
                  <span className="text-xs text-gray-500">or provide external URL directly below</span>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Direct Logo URL</label>
                  <input
                    type="url"
                    value={logoState.url}
                    onChange={(e) => setLogoState({ ...logoState, url: e.target.value })}
                    placeholder="https://.../hotel-logo.png"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold transition-colors"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    If left blank, the platform automatically renders the luxurious golden star crest.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                    Hotel Name / Brand Title
                  </label>
                  <input
                    type="text"
                    value={logoState.site_title || ''}
                    onChange={(e) => setLogoState({ ...logoState, site_title: e.target.value })}
                    placeholder="CITY STAR"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                    Tagline / Sub-Label
                  </label>
                  <input
                    type="text"
                    value={logoState.tag_line || ''}
                    onChange={(e) => setLogoState({ ...logoState, tag_line: e.target.value })}
                    placeholder="Hotel & Suites"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Accessibility Alt Text</label>
                <input
                  type="text"
                  value={logoState.alt_text || logoState.alt || ''}
                  onChange={(e) => setLogoState({ ...logoState, alt_text: e.target.value })}
                  placeholder="City Star Hotel & Suites Logo"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={handleSaveLogo}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                >
                  {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Brand Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="space-y-6">
            <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 shadow-xl">
              <h4 className="text-xs uppercase tracking-widest text-hotel-gold font-bold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-hotel-gold" />
                Live Brand Preview
              </h4>

              {/* Dark Navbar Preview */}
              <div className="p-4 rounded-2xl bg-[#080C15] border border-white/10 space-y-3">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Navbar Header Mockup</span>
                <div className="flex items-center gap-3">
                  {logoState.url ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-hotel-gold/40">
                      <Image
                        src={logoState.url}
                        alt={logoState.alt_text || logoState.alt || 'City Star Logo'}
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-hotel-gold/60 flex items-center justify-center bg-hotel-dark shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                      <Star className="w-5 h-5 text-hotel-gold fill-hotel-gold/20" />
                    </div>
                  )}
                  <div>
                    <span className="font-serif text-lg font-bold tracking-wider text-white block leading-none">
                      {logoState.site_title || 'CITY STAR'}
                    </span>
                    <span className="text-[9px] tracking-[0.25em] text-hotel-gold uppercase font-medium">
                      {logoState.tag_line || 'Hotel & Suites'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hero Showcase Banner */}
      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Hero Banner Content</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Customize the front-facing hero image, headline, and subheadline shown on the guest landing page.
                </p>
              </div>

              {/* Hero Image */}
              <div className="space-y-4">
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold">
                  Hero Background Image (Supabase Storage or URL)
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors">
                    <Upload className="w-4 h-4 text-hotel-gold" />
                    <span>{isUploadingHero ? 'Uploading...' : 'Upload Hero Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingHero}
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          'hero',
                          (url) => setHeroState((prev) => ({ ...prev, image_url: url })),
                          setIsUploadingHero
                        )
                      }
                    />
                  </label>
                  <span className="text-xs text-gray-500">Recommended: 1920x1080 or higher</span>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Image URL</label>
                  <input
                    type="url"
                    value={heroState.image_url}
                    onChange={(e) => setHeroState({ ...heroState, image_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                  />
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={heroState.headline}
                  onChange={(e) => setHeroState({ ...heroState, headline: e.target.value })}
                  placeholder="Elegance Redefined, Luxury Realized"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              {/* Subheadline */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  Subheadline Description
                </label>
                <textarea
                  rows={3}
                  value={heroState.subheadline}
                  onChange={(e) => setHeroState({ ...heroState, subheadline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              {/* CTA text */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                  Call-To-Action Button Label
                </label>
                <input
                  type="text"
                  value={heroState.cta_text || 'Reserve a Suite'}
                  onChange={(e) => setHeroState({ ...heroState, cta_text: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={handleSaveHero}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
                >
                  {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Hero Banner</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="space-y-6">
            <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 shadow-xl">
              <h4 className="text-xs uppercase tracking-widest text-hotel-gold font-bold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-hotel-gold" />
                Live Banner Mockup
              </h4>

              <div className="relative h-72 rounded-2xl overflow-hidden border border-white/10 flex flex-col justify-end p-5">
                {heroState.image_url ? (
                  <Image
                    src={heroState.image_url}
                    alt="Hero Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-hotel-gold/30 text-[9px] uppercase tracking-wider text-hotel-gold">
                    <Sparkles className="w-3 h-3 text-hotel-gold" />
                    <span>Urban Sanctuary</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white leading-tight">
                    {heroState.headline}
                  </h3>
                  <p className="text-[11px] text-gray-300 line-clamp-2 font-light">
                    {heroState.subheadline}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-hotel-gold text-hotel-dark font-bold text-[10px] uppercase tracking-wider">
                      {heroState.cta_text || 'Reserve a Suite'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Hotel Showcase Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Hotel Showcase Gallery</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Manage the photography showcase displayed across the website. Filter by area, highlight featured shots, or upload new images.
                </p>
              </div>

              <button
                onClick={() => setIsAddingGalleryItem(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Photo</span>
              </button>
            </div>

            {/* Add Photo Form */}
            {isAddingGalleryItem && (
              <div className="p-5 rounded-2xl bg-white/5 border border-hotel-gold/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest text-hotel-gold font-bold">
                    Add Photo to Media Library
                  </h4>
                  <button
                    onClick={() => setIsAddingGalleryItem(false)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                      Upload from Device
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors w-full justify-center">
                      <Upload className="w-4 h-4 text-hotel-gold" />
                      <span>{isUploadingGallery ? 'Uploading to Bucket...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingGallery}
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            'gallery',
                            (url) => setNewGalleryItem((prev) => ({ ...prev, url })),
                            setIsUploadingGallery
                          )
                        }
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5">
                      Or Direct Image URL
                    </label>
                    <input
                      type="url"
                      value={newGalleryItem.url}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, url: e.target.value })}
                      placeholder="https://.../photo.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1.5">Photo Caption / Title</label>
                    <input
                      type="text"
                      value={newGalleryItem.caption}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                      placeholder="Presidential Suite Sunset Lounge"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                    <select
                      value={newGalleryItem.category}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#080C15] border border-white/10 text-xs text-white focus:outline-none focus:border-hotel-gold"
                    >
                      <option value="suites">Suites & Rooms</option>
                      <option value="dining">Dining & Lounge</option>
                      <option value="pool">Pool & Spa</option>
                      <option value="lobby">Lobby & Architecture</option>
                      <option value="gym">Fitness & Wellness</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={newGalleryItem.is_featured}
                      onChange={(e) =>
                        setNewGalleryItem({ ...newGalleryItem, is_featured: e.target.checked })
                      }
                      className="rounded border-white/20 bg-white/5 text-hotel-gold focus:ring-hotel-gold"
                    />
                    <span>Highlight as Featured Showcase Photo</span>
                  </label>

                  <button
                    onClick={handleAddGalleryImage}
                    className="px-5 py-2 rounded-xl bg-hotel-gold hover:bg-hotel-gold-hover text-hotel-dark font-bold text-xs uppercase tracking-wider"
                  >
                    Confirm & Add Photo
                  </button>
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              {GALLERY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedGalleryCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedGalleryCategory === cat.id
                      ? 'bg-hotel-gold/20 text-hotel-gold border border-hotel-gold/40'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            {filteredGallery.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No photos found in this category. Click &quot;Add New Photo&quot; to populate your gallery.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {filteredGallery.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-[#0F1626] border border-white/10 rounded-2xl overflow-hidden hover:border-hotel-gold/40 transition-all shadow-lg flex flex-col"
                  >
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={item.url}
                        alt={item.caption || item.title || 'Hotel photo'}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.is_featured && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-hotel-gold text-hotel-dark font-bold text-[9px] uppercase tracking-wider shadow">
                          Featured
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-gray-300 text-[10px] uppercase font-medium">
                        {item.category}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white leading-tight">
                          {item.caption}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleToggleFeatured(item.id)}
                          className={`text-xs flex items-center gap-1 font-medium transition-colors ${
                            item.is_featured
                              ? 'text-hotel-gold hover:text-hotel-gold/80'
                              : 'text-gray-400 hover:text-hotel-gold'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.is_featured ? 'fill-hotel-gold' : ''}`} />
                          <span>{item.is_featured ? 'Featured' : 'Make Featured'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteGalleryImage(item.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Concierge & Contact Info */}
      {activeTab === 'contact' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-[#0A101D] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Concierge & Contact Details</h3>
              <p className="text-xs text-gray-400 mt-1">
                Configure official hotel contact numbers, concierge email, and physical metropolitan address.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-hotel-gold" />
                  Primary Reservations & Concierge Telephone
                </label>
                <input
                  type="text"
                  value={contactState.phone}
                  onChange={(e) => setContactState({ ...contactState, phone: e.target.value })}
                  placeholder="+1 (800) 248-9782"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-hotel-gold" />
                  Concierge Inquiries Email
                </label>
                <input
                  type="email"
                  value={contactState.email}
                  onChange={(e) => setContactState({ ...contactState, email: e.target.value })}
                  placeholder="concierge@citystarhotel.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-hotel-gold font-semibold mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-hotel-gold" />
                  Physical Hotel Address
                </label>
                <input
                  type="text"
                  value={contactState.address}
                  onChange={(e) => setContactState({ ...contactState, address: e.target.value })}
                  placeholder="450 Grand Star Boulevard, Metropolitan Center"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-hotel-gold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSaveContact}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-hotel-gold to-[#B8972E] text-hotel-dark font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Contact Info</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
