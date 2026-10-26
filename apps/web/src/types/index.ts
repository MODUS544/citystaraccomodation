export type UserRole = 'guest' | 'receptionist' | 'admin';

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price_per_night: number | string;
  max_occupancy: number;
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
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_amount: number | string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
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
