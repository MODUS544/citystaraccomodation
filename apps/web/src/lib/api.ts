import { 
  RoomType, 
  AvailableRoom, 
  Booking, 
  ApiResponse, 
  SiteSettings, 
  WalkInGuest, 
  AvailableWalkInRoom, 
  WalkInBookingPayload 
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://citystaraccomodation.onrender.com/api/v1';

// Seed Fallback Dataset ensuring zero downtime or cold-start disruption on Vercel
export const FALLBACK_ROOM_TYPES: RoomType[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Executive Twin Room',
    slug: 'executive-twin-room',
    description: 'Designed for corporate travelers, development partners, or companions traveling together. Features two premium twin beds, local artisan accents, and a secure ergonomic workstation.',
    base_price_per_night: 180000,
    max_occupancy: 2,
    amenities: ['2 Twin Beds', 'Executive Work Desk', 'Ergonomic Leather Chair', 'High-Speed Fiber Wi-Fi', 'Direct Intercom & Smart Climate Control', 'Local Artisan Accents', 'In-Room Safe'],
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Deluxe King Suite',
    slug: 'deluxe-king-suite',
    description: 'Spacious retreat featuring a plush king-size bed, private marble bathroom with rain shower, private balcony overlooking the city skyline, and complimentary royal tea service.',
    base_price_per_night: 250000,
    max_occupancy: 2,
    amenities: ['Plush King Bed', 'Private City View Balcony', 'Italian Marble Bathroom', 'Ultra-Fast Fiber Wi-Fi', 'Mini-Bar & Espresso Station', 'Complimentary Royal Tea', 'Smart Climate Control'],
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Shehu Royal Penthouse',
    slug: 'shehu-royal-penthouse',
    description: 'The pinnacle of luxury in Borno State. Panoramic citywide views, master king suite, private guest bedroom, expansive dining hall, private hydrotherapy jacuzzi, and 24/7 dedicated butler & concierge service.',
    base_price_per_night: 750000,
    max_occupancy: 4,
    amenities: ['Master King & Guest Queen Suite', 'Private Hydrotherapy Jacuzzi', 'Panoramic Skyline & Courtyard View', 'Dedicated 24/7 VIP Butler', 'Private Dining & Meeting Lounge', 'Lake Chad & Kanem Art Accents', 'VIP Airport Chauffeur'],
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

export async function fetchRoomTypes(): Promise<RoomType[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/types`, {
      next: { revalidate: 60 },
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch from backend');
    const json: ApiResponse<RoomType[]> = await res.json();
    if (json.success && json.data && json.data.length > 0) {
      return json.data;
    }
    return FALLBACK_ROOM_TYPES;
  } catch (err) {
    console.warn('API connection fallback: using local seed room types.');
    return FALLBACK_ROOM_TYPES;
  }
}

export async function fetchRoomBySlug(slug: string): Promise<RoomType | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/rooms/types/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Not found');
    const json: ApiResponse<RoomType> = await res.json();
    if (json.success && json.data) return json.data;
    return FALLBACK_ROOM_TYPES.find((r) => r.slug === slug) || null;
  } catch {
    return FALLBACK_ROOM_TYPES.find((r) => r.slug === slug) || null;
  }
}

export async function fetchAvailableRooms(
  checkIn: string,
  checkOut: string,
  guests: number = 1
): Promise<AvailableRoom[]> {
  try {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
    });
    const res = await fetch(`${API_BASE_URL}/rooms/available?${params.toString()}`);
    if (!res.ok) throw new Error('Availability query failed');
    const json: ApiResponse<AvailableRoom[]> = await res.json();
    if (json.success && json.data) return json.data;
  } catch (err) {
    console.warn('Live availability fetch failed, formatting from fallback catalog.');
  }

  // Graceful fallback response
  return FALLBACK_ROOM_TYPES
    .filter((rt) => rt.max_occupancy >= guests)
    .map((rt, index) => ({
      id: `room-${index + 101}`,
      room_number: `${101 + index}`,
      floor: 1 + Math.floor(index / 2),
      status: 'available',
      room_type_id: rt.id,
      room_type_name: rt.name,
      room_type_slug: rt.slug,
      base_price_per_night: rt.base_price_per_night,
      max_occupancy: rt.max_occupancy,
      amenities: rt.amenities,
      images: rt.images,
    }));
}

export async function submitBooking(payload: {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  token?: string;
}): Promise<Booking> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (payload.token) {
    headers['Authorization'] = `Bearer ${payload.token}`;
  }

  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      roomId: payload.roomId,
      roomTypeId: payload.roomId,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      specialRequests: payload.specialRequests,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone,
    }),
  });

  const json: ApiResponse<Booking> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to complete reservation');
  }

  return json.data;
}

export async function fetchBookingByReference(
  reference: string,
  token?: string
): Promise<Booking | null> {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  
  let activeToken = token;
  if (!activeToken && typeof window !== 'undefined') {
    activeToken = localStorage.getItem('citystar_auth_token') || undefined;
  }
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const cleanRef = reference.trim().toUpperCase();

  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(cleanRef)}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const json: ApiResponse<Booking> = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }

    // Fallback: If not found via guest endpoint and user has admin/staff session, query admin search
    if (activeToken) {
      try {
        const adminRes = await fetch(`${API_BASE_URL}/admin/bookings?search=${encodeURIComponent(cleanRef)}`, {
          headers,
          cache: 'no-store',
        });
        if (adminRes.ok) {
          const adminJson = await adminRes.json();
          if (adminJson.success && adminJson.data?.bookings?.length > 0) {
            const match = adminJson.data.bookings.find(
              (b: any) => b.booking_reference?.trim().toUpperCase() === cleanRef
            ) || adminJson.data.bookings[0];
            return match;
          }
        }
      } catch {}
    }

    return null;
  } catch (err) {
    console.error('fetchBookingByReference error:', err);
    return null;
  }
}

export interface AdminKPIs {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  cleaningRooms: number;
  occupancyRate: number;
  checkInsToday: number;
  checkOutsToday: number;
  pendingBookings?: number;
  activeBookings?: number;
  monthToDateRevenue: number;
  yearToDateRevenue: number;
}

export interface AdminActionBooking {
  id: string;
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  total_amount: number | string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_id: string;
  room_number: string;
  floor: number;
  room_type_name: string;
  special_requests?: string;
  created_at?: string;
}

export interface AdminOverviewResponse {
  kpis: AdminKPIs;
  todaysActions: AdminActionBooking[];
}

export interface AdminRoom {
  id: string;
  room_number: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  notes?: string;
  updated_at: string;
  room_type_id: string;
  room_type_name: string;
  room_type_slug: string;
  base_price_per_night: number | string;
  max_occupancy: number;
}

export function getAdminAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('citystar_auth_token') || '';
  }
  return '';
}

export async function fetchAdminOverview(token?: string): Promise<AdminOverviewResponse> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/overview`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch overview');
    const json: ApiResponse<AdminOverviewResponse> = await res.json();
    if (json.success && json.data) {
      if (!json.data.todaysActions || json.data.todaysActions.length === 0) {
        try {
          const bookingsRes = await fetch(`${API_BASE_URL}/admin/bookings?limit=30`, { headers, cache: 'no-store' });
          if (bookingsRes.ok) {
            const bookingsJson = await bookingsRes.json();
            if (bookingsJson.success && bookingsJson.data?.bookings?.length > 0) {
              json.data.todaysActions = bookingsJson.data.bookings;
            }
          }
        } catch {}
      }
      return json.data;
    }
  } catch (err) {
    console.warn('Admin overview fetch fallback:', err);
  }

  // Resilient fallback for demonstration
  return {
    kpis: {
      totalRooms: 5,
      occupiedRooms: 2,
      availableRooms: 2,
      maintenanceRooms: 1,
      cleaningRooms: 0,
      occupancyRate: 40.0,
      checkInsToday: 3,
      checkOutsToday: 1,
      monthToDateRevenue: 12450.00,
      yearToDateRevenue: 89300.00,
    },
    todaysActions: [
      {
        id: 'mock-1',
        booking_reference: 'CH.MAVBU',
        check_in_date: new Date().toISOString().split('T')[0],
        check_out_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        total_nights: 2,
        total_amount: 500000,
        status: 'confirmed',
        guest_name: 'Lord Alistair Sterling',
        guest_email: 'sterling@luxury.co.uk',
        guest_phone: '+44 20 7946 0991',
        room_id: '11111111-1111-1111-1111-111111111111',
        room_number: '101',
        floor: 1,
        room_type_name: 'Deluxe King Suite',
        special_requests: 'Late arrival, airport transfer needed',
      },
      {
        id: 'mock-2',
        booking_reference: 'CH.KLMNO',
        check_in_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
        check_out_date: new Date().toISOString().split('T')[0],
        total_nights: 3,
        total_amount: 540000,
        status: 'checked_in',
        guest_name: 'Dr. Vivienne Moreau',
        guest_email: 'moreau@sorbonne.fr',
        room_id: '22222222-2222-2222-2222-222222222222',
        room_number: '201',
        floor: 2,
        room_type_name: 'Executive Twin Room',
        special_requests: 'Luggage storage until 4 PM',
      },
      {
        id: 'mock-3',
        booking_reference: 'CH.ROYAL',
        check_in_date: new Date().toISOString().split('T')[0],
        check_out_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        total_nights: 4,
        total_amount: 1800,
        status: 'confirmed',
        guest_name: 'Baroness Sofia Hapsburg',
        guest_email: 'sofia@vienna-capital.at',
        room_id: '33333333-3333-3333-3333-333333333333',
        room_number: '501',
        floor: 5,
        room_type_name: 'Presidential Penthouse',
        special_requests: 'Dom Pérignon chilled in suite',
      },
    ],
  };
}

export async function fetchAdminBookings(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  },
  token?: string
): Promise<{ bookings: AdminActionBooking[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.search) query.set('search', params.search);

  try {
    const res = await fetch(`${API_BASE_URL}/admin/bookings?${query.toString()}`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const json = await res.json();
    if (json.success && json.data) return json.data;
  } catch (err) {
    console.warn('Admin bookings fetch fallback:', err);
  }

  return {
    bookings: (await fetchAdminOverview(activeToken)).todaysActions,
    pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
  };
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled',
  token?: string
): Promise<any> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to update booking status');
  }
  return json.data;
}

export async function fetchAdminRooms(token?: string): Promise<AdminRoom[]> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/rooms`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch rooms');
    const json = await res.json();
    if (json.success && json.data) return json.data;
  } catch (err) {
    console.warn('Admin rooms fetch fallback:', err);
  }

  // Seed Fallback
  return [
    {
      id: '101',
      room_number: '101',
      floor: 1,
      status: 'available',
      updated_at: new Date().toISOString(),
      room_type_id: '1',
      room_type_name: 'Deluxe King Suite',
      room_type_slug: 'deluxe-king-suite',
      base_price_per_night: 250000,
      max_occupancy: 2,
    },
    {
      id: '102',
      room_number: '102',
      floor: 1,
      status: 'occupied',
      updated_at: new Date().toISOString(),
      room_type_id: '1',
      room_type_name: 'Deluxe King Suite',
      room_type_slug: 'deluxe-king-suite',
      base_price_per_night: 250000,
      max_occupancy: 2,
    },
    {
      id: '201',
      room_number: '201',
      floor: 2,
      status: 'available',
      updated_at: new Date().toISOString(),
      room_type_id: '2',
      room_type_name: 'Executive Twin Room',
      room_type_slug: 'executive-twin-room',
      base_price_per_night: 180000,
      max_occupancy: 2,
    },
    {
      id: '202',
      room_number: '202',
      floor: 2,
      status: 'maintenance',
      notes: 'HVAC filter replacement scheduled',
      updated_at: new Date().toISOString(),
      room_type_id: '2',
      room_type_name: 'Executive Twin Room',
      room_type_slug: 'executive-twin-room',
      base_price_per_night: 180000,
      max_occupancy: 2,
    },
    {
      id: '501',
      room_number: '501',
      floor: 5,
      status: 'available',
      updated_at: new Date().toISOString(),
      room_type_id: '3',
      room_type_name: 'Shehu Royal Penthouse',
      room_type_slug: 'shehu-royal-penthouse',
      base_price_per_night: 750000,
      max_occupancy: 4,
    },
  ];
}

export async function updateRoomStatus(
  roomId: string,
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order',
  token?: string
): Promise<any> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/rooms/${roomId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to update room status');
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// GLOBAL SITE CONTENT & MEDIA CMS API (Super Admin)
// ---------------------------------------------------------------------------

export async function fetchPublicSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/public`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch public settings');
    const json = await res.json();
    return json.success && json.data ? json.data : {};
  } catch (err) {
    console.warn('Public settings fetch notice:', err);
    return {};
  }
}

export async function fetchAdminSettings(token?: string): Promise<SiteSettings> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers, cache: 'no-store' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch admin settings');
  return json.data;
}

export async function updateSiteSetting(key: string, value: any, token?: string): Promise<any> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ value }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || `Failed to update site setting ${key}`);
  return json.data;
}

export async function getSignedUploadUrl(
  fileName: string,
  fileType?: string,
  folder = 'branding',
  token?: string
): Promise<{ filePath: string; signedUrl?: string; token?: string; publicUrl: string; directUploadRequired?: boolean }> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/uploads/signed-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileName, fileType, folder }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to generate signed upload URL');
  return json.data;
}

export async function uploadDirectAsset(
  fileOrName: File | string,
  dataUriOrFolder?: string,
  folder = 'branding',
  token?: string
): Promise<{ filePath: string; publicUrl: string }> {
  let fileName: string;
  let dataUri: string;
  let targetFolder: string;
  let activeToken: string | null;

  if (typeof window !== 'undefined' && fileOrName instanceof File) {
    fileName = fileOrName.name;
    targetFolder = dataUriOrFolder || 'branding';
    activeToken = token || getAdminAuthToken();
    dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrName);
    });
  } else {
    fileName = fileOrName as string;
    dataUri = dataUriOrFolder as string;
    targetFolder = folder;
    activeToken = token || getAdminAuthToken();
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/uploads/direct`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileName, dataUri, folder: targetFolder }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to upload asset directly');
  return json.data;
}

export async function updateRoomType(
  id: string,
  payload: {
    name?: string;
    description?: string;
    basePricePerNight?: number;
    maxOccupancy?: number;
    amenities?: string[];
    images?: string[];
  },
  token?: string
): Promise<any> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/admin/room-types/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update room type');
  return json.data;
}

// ---------------------------------------------------------------------------
// FRONT-DESK WALK-IN GUEST ONBOARDING & ROOM ALLOCATION API
// ---------------------------------------------------------------------------

export async function fetchAvailableRoomsForWalkIn(
  roomTypeId?: string,
  checkInDate?: string,
  checkOutDate?: string,
  token?: string
): Promise<AvailableWalkInRoom[]> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const queryParams = new URLSearchParams();
  if (roomTypeId) queryParams.set('roomTypeId', roomTypeId);
  if (checkInDate) queryParams.set('checkInDate', checkInDate);
  if (checkOutDate) queryParams.set('checkOutDate', checkOutDate);
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const res = await fetch(`${API_BASE_URL}/frontdesk/rooms/available${qs}`, { headers, cache: 'no-store' });
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('fetchAvailableRoomsForWalkIn fallback:', err);
    return [];
  }
}

export async function lookupWalkInGuest(query: string, token?: string): Promise<WalkInGuest | null> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE_URL}/frontdesk/walk-in/lookup?query=${encodeURIComponent(query)}`, {
    headers,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) return null;
  const list = json.data;
  if (Array.isArray(list) && list.length > 0) {
    const raw = list[0];
    return {
      ...raw,
      fullName: raw.full_name || raw.fullName,
      phoneNumber: raw.phone_number || raw.phoneNumber,
      dateOfBirth: raw.date_of_birth || raw.dateOfBirth,
      idDocumentType: raw.id_document_type || raw.id_type || raw.idDocumentType,
      idNumber: raw.id_number || raw.idNumber,
      emergencyContactName: raw.emergency_contact_name || raw.emergencyContactName,
      emergencyContactPhone: raw.emergency_contact_phone || raw.emergencyContactPhone,
    };
  }
  return null;
}

export async function createWalkInBooking(payload: WalkInBookingPayload, token?: string): Promise<any> {
  const activeToken = token || getAdminAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  // Normalize nested or flat payload to match backend walkInBookingSchema
  const body =
    payload.guest && payload.booking
      ? {
          fullName: payload.guest.fullName,
          phoneNumber: payload.guest.phoneNumber,
          email: payload.guest.email || undefined,
          dateOfBirth: payload.guest.dateOfBirth || undefined,
          idType: payload.guest.idDocumentType,
          idNumber: payload.guest.idNumber,
          address: payload.guest.address,
          emergencyContactName: payload.guest.emergencyContactName,
          emergencyContactPhone: payload.guest.emergencyContactPhone,
          roomId: payload.booking.roomId,
          roomTypeId: payload.booking.roomTypeId,
          checkInDate: payload.booking.checkInDate,
          checkOutDate: payload.booking.checkOutDate,
          paymentMethod: payload.booking.paymentMethod,
          autoCheckIn: payload.booking.autoCheckIn ?? true,
          specialRequests: payload.booking.specialRequests,
        }
      : payload;

  const res = await fetch(`${API_BASE_URL}/frontdesk/walk-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to complete walk-in reservation');
  return json.data;
}

