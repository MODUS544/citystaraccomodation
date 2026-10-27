export type UserRole = 'guest' | 'receptionist' | 'staff' | 'admin' | 'super_admin';

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price_per_night: number | string;
  basePrice?: number;
  max_occupancy: number;
  maxGuests?: number;
  amenities: string[];
  images: string[];
  is_active?: boolean;
}

export interface AvailableRoom {
  id: string;
  room_number: string;
  floor: number;
  status: string;
  room_type_id: string;
  room_type_name: string;
  room_type_slug: string;
  base_price_per_night: number | string;
  max_occupancy: number;
  amenities: string[];
  images: string[];
}

export interface Booking {
  id: string;
  booking_reference: string;
  guest_id?: string;
  walk_in_guest_id?: string;
  booked_by_staff_id?: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_amount: number | string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  payment_method?: 'cash' | 'pos_terminal' | 'transfer' | 'card_online';
  special_requests?: string;
  created_at: string;
  room_number?: string;
  floor?: number;
  room_type_name?: string;
  room_images?: string[];
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Media & Site Settings CMS Types
export interface BrandLogoSetting {
  url: string;
  alt?: string;
  alt_text?: string;
  site_title?: string;
  tag_line?: string;
  width?: number;
  height?: number;
}

export interface HeroBannerSetting {
  url?: string;
  image_url?: string;
  headline?: string;
  subheadline?: string;
  tagline?: string;
  cta_text?: string;
}

export interface GalleryImageSetting {
  id: string;
  title?: string;
  caption?: string;
  category: string;
  url: string;
  is_featured?: boolean;
}

export interface ContactInfoSetting {
  phone?: string;
  email?: string;
  address?: string;
  social_links?: Record<string, string>;
}

export interface SiteSettings {
  brand_logo?: BrandLogoSetting;
  hero_banner?: HeroBannerSetting;
  hotel_gallery?: { images?: GalleryImageSetting[] } | GalleryImageSetting[];
  contact_info?: ContactInfoSetting;
}

// Front Desk Walk-In Types
export type IdDocumentType = 'nin' | 'national_id' | 'passport' | 'drivers_license' | 'voters_card';

export interface WalkInGuest {
  id?: string;
  full_name?: string;
  fullName?: string;
  phone_number?: string;
  phoneNumber?: string;
  email?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  id_type?: IdDocumentType;
  id_document_type?: IdDocumentType;
  idDocumentType?: IdDocumentType;
  id_number?: string;
  idNumber?: string;
  address?: string;
  emergency_contact_name?: string;
  emergencyContactName?: string;
  emergency_contact_phone?: string;
  emergencyContactPhone?: string;
  created_at?: string;
}

export interface AvailableWalkInRoom {
  id?: string;
  room_id?: string;
  room_number?: string;
  roomNumber?: string;
  floor?: number;
  status?: string;
  room_type_id?: string;
  room_type_name?: string;
  room_type_slug?: string;
  base_price_per_night?: number | string;
  max_occupancy?: number;
}

export interface WalkInBookingPayload {
  guest?: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    dateOfBirth?: string;
    idDocumentType: IdDocumentType;
    idNumber: string;
    address: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
  booking?: {
    roomId?: string;
    roomTypeId: string;
    checkInDate: string;
    checkOutDate: string;
    adults?: number;
    children?: number;
    paymentMethod: 'cash' | 'pos_terminal' | 'transfer' | 'card_online';
    paymentReference?: string;
    autoCheckIn?: boolean;
    specialRequests?: string;
  };
  // Flat fallback fields
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  dateOfBirth?: string;
  idType?: IdDocumentType;
  idNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  roomId?: string;
  roomTypeId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  paymentMethod?: 'cash' | 'pos_terminal' | 'transfer' | 'card_online';
  autoCheckIn?: boolean;
  specialRequests?: string;
}
