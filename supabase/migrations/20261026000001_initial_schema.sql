-- =============================================================================
-- CITY STAR HOTEL - COMPREHENSIVE SUPABASE / POSTGRESQL DDL MIGRATION
-- Migration Version: 20261026000001_initial_schema.sql
-- Modules: profiles, room_types, rooms, bookings, payments
-- Concurrency & Security: Row-Level Locking, GiST Exclusion Constraints, RLS & RBAC
-- Target Database: Supabase PostgreSQL (Postgres 15+)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for GiST multi-column exclusion constraints

-- -----------------------------------------------------------------------------
-- 2. ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('guest', 'receptionist', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning', 'out_of_order');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'stripe', 'paystack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 3. UTILITY FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. TABLES DEFINITIONS
-- -----------------------------------------------------------------------------

-- 4.1 PROFILES TABLE
-- Extends Supabase auth.users with application-level profile and RBAC roles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    role user_role NOT NULL DEFAULT 'guest',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.2 ROOM TYPES TABLE
CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    base_price_per_night NUMERIC(10, 2) NOT NULL CHECK (base_price_per_night >= 0),
    max_occupancy INTEGER NOT NULL CHECK (max_occupancy > 0),
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for room_types updated_at
DROP TRIGGER IF EXISTS trigger_room_types_updated_at ON public.room_types;
CREATE TRIGGER trigger_room_types_updated_at
    BEFORE UPDATE ON public.room_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.3 ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT NOT NULL UNIQUE,
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
    floor INTEGER NOT NULL CHECK (floor >= 0),
    status room_status NOT NULL DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for rooms updated_at
DROP TRIGGER IF EXISTS trigger_rooms_updated_at ON public.rooms;
CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.4 BOOKINGS TABLE
-- Implements GiST range exclusion constraint to mathematically prevent double bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    total_nights INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status booking_status NOT NULL DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Constraint: Check-out must strictly be after check-in
    CONSTRAINT check_dates_valid CHECK (check_out_date > check_in_date),

    -- Concurrency Safety: GiST Exclusion Constraint against double-booking active reservations
    CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
        room_id WITH =,
        daterange(check_in_date, check_out_date, '[)') WITH &&
    ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

-- Trigger for bookings updated_at
DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4.5 PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_reference TEXT NOT NULL UNIQUE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    transaction_id TEXT,
    gateway_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger for payments updated_at
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_room_types_slug ON public.room_types(slug);
CREATE INDEX IF NOT EXISTS idx_room_types_active ON public.room_types(is_active);

CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON public.rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.rooms(floor);

CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(payment_reference);

-- -----------------------------------------------------------------------------
-- 6. ATOMIC BOOKING STORED PROCEDURE (ROW-LEVEL LOCKING)
-- -----------------------------------------------------------------------------
-- Enables transactional reservations with SELECT ... FOR UPDATE to avoid race conditions
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_guest_id UUID,
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_total_amount NUMERIC,
    p_special_requests TEXT DEFAULT NULL
)
RETURNS public.bookings AS $$
DECLARE
    v_room_record public.rooms%ROWTYPE;
    v_overlap_count INTEGER;
    v_booking_ref TEXT;
    v_new_booking public.bookings%ROWTYPE;
BEGIN
    -- Validate date integrity
    IF p_check_out <= p_check_in THEN
        RAISE EXCEPTION 'INVALID_DATE_RANGE: check_out_date must be strictly after check_in_date'
            USING ERRCODE = '22000';
    END IF;

    -- 1. Acquire row-level lock on the room record
    SELECT * INTO v_room_record
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ROOM_NOT_FOUND: Room % does not exist', p_room_id
            USING ERRCODE = '02000';
    END IF;

    IF v_room_record.status NOT IN ('available', 'cleaning') THEN
        RAISE EXCEPTION 'ROOM_UNAVAILABLE: Room % is currently marked as %', p_room_id, v_room_record.status
            USING ERRCODE = '23514';
    END IF;

    -- 2. Verify no overlapping active bookings exist
    SELECT COUNT(*) INTO v_overlap_count
    FROM public.bookings
    WHERE room_id = p_room_id
      AND status NOT IN ('cancelled', 'no_show')
      AND daterange(check_in_date, check_out_date, '[)') && daterange(p_check_in, p_check_out, '[)');

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'DOUBLE_BOOKING_CONFLICT: Room % is already reserved for the selected date range', p_room_id
            USING ERRCODE = '23P01';
    END IF;

    -- 3. Generate booking reference: CSH-YYYYMMDD-HEX(6)
    v_booking_ref := 'CSH-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    -- 4. Insert booking
    INSERT INTO public.bookings (
        booking_reference,
        guest_id,
        room_id,
        check_in_date,
        check_out_date,
        total_amount,
        status,
        special_requests
    ) VALUES (
        v_booking_ref,
        p_guest_id,
        p_room_id,
        p_check_in,
        p_check_out,
        p_total_amount,
        'pending',
        p_special_requests
    )
    RETURNING * INTO v_new_booking;

    RETURN v_new_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 7. SUPABASE AUTH USER TRIGGER (AUTO-PROVISION PROFILE)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role public.user_role := 'guest';
BEGIN
    -- Allow initial admin setup via metadata if specified
    IF (NEW.raw_user_meta_data->>'role') IS NOT NULL AND
       (NEW.raw_user_meta_data->>'role') IN ('guest', 'receptionist', 'admin') THEN
        v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_number,
        role,
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone_number',
        v_role,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions for fast role checks
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('receptionist', 'admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 8.1 PROFILES POLICIES
-- Guests can read their own profile; staff can view all profiles
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff());

-- Users can update their own details (non-role fields handled by API or trigger)
CREATE POLICY "profiles_update_self_or_admin"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- 8.2 ROOM TYPES POLICIES
-- Anyone (including unauthenticated guests) can view active room types
CREATE POLICY "room_types_public_read"
    ON public.room_types FOR SELECT
    USING (is_active = true OR public.is_staff());

-- Only staff can insert/update room types
CREATE POLICY "room_types_staff_all"
    ON public.room_types FOR ALL
    USING (public.is_staff());

-- 8.3 ROOMS POLICIES
-- Anyone can view room directory
CREATE POLICY "rooms_read_policy"
    ON public.rooms FOR SELECT
    USING (true);

-- Only staff can modify rooms
CREATE POLICY "rooms_staff_all"
    ON public.rooms FOR ALL
    USING (public.is_staff());

-- 8.4 BOOKINGS POLICIES
-- Guests can read their own bookings; staff can read all
CREATE POLICY "bookings_select_policy"
    ON public.bookings FOR SELECT
    USING (auth.uid() = guest_id OR public.is_staff());

-- Guests can create reservations for themselves; staff can create for any guest
CREATE POLICY "bookings_insert_policy"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = guest_id OR public.is_staff());

-- Guests can cancel their own pending/confirmed bookings; staff can update any
CREATE POLICY "bookings_update_policy"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = guest_id OR public.is_staff());

-- 8.5 PAYMENTS POLICIES
-- Guests can view payments associated with their bookings; staff can view all
CREATE POLICY "payments_select_policy"
    ON public.payments FOR SELECT
    USING (
        public.is_staff() OR
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payments.booking_id
              AND bookings.guest_id = auth.uid()
        )
    );

-- Payments can be created by authenticated users or backend service role
CREATE POLICY "payments_insert_policy"
    ON public.payments FOR INSERT
    WITH CHECK (
        public.is_staff() OR
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payments.booking_id
              AND bookings.guest_id = auth.uid()
        )
    );

-- Only staff/admins can update payment status directly
CREATE POLICY "payments_update_policy"
    ON public.payments FOR UPDATE
    USING (public.is_staff());

-- -----------------------------------------------------------------------------
-- 9. SEED DATA (INITIAL HOTEL CONFIGURATION)
-- -----------------------------------------------------------------------------
INSERT INTO public.room_types (id, name, slug, description, base_price_per_night, max_occupancy, amenities, images)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Deluxe King Suite',
        'deluxe-king-suite',
        'Spacious room featuring a plush king-size bed, private marble bathroom, city view balcony, and high-speed fiber Wi-Fi.',
        150.00,
        2,
        '["King Bed", "Private Balcony", "Marble Bathroom", "Fiber Wi-Fi", "4K Smart TV", "Mini Bar", "Air Conditioning"]'::jsonb,
        '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b", "https://images.unsplash.com/photo-1590490360182-c33d57733427"]'::jsonb
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Executive Twin Room',
        'executive-twin-room',
        'Designed for business travelers or friends traveling together, featuring two premium twin beds and ergonomic workstation.',
        120.00,
        2,
        '["2 Twin Beds", "Work Desk", "Ergonomic Chair", "Fiber Wi-Fi", "Coffee Maker", "Safe", "Air Conditioning"]'::jsonb,
        '["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf", "https://images.unsplash.com/photo-1566665797739-1674de7a421a"]'::jsonb
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Presidential Penthouse',
        'presidential-penthouse',
        'The pinnacle of luxury at City Star Hotel. Panoramic skyline views, master suite, dining area, jacuzzi, and dedicated butler service.',
        450.00,
        4,
        '["Master King Bedroom", "Guest Queen Bedroom", "Private Jacuzzi", "Panoramic View", "Dining Area", "Butler Service", "Complimentary Champagne"]'::jsonb,
        '["https://images.unsplash.com/photo-1618773928121-c32242e63f39", "https://images.unsplash.com/photo-1578683010236-d716f9a3f461"]'::jsonb
    )
ON CONFLICT (name) DO NOTHING;

-- Seed Sample Rooms across floors
INSERT INTO public.rooms (room_number, room_type_id, floor, status)
VALUES
    ('101', '11111111-1111-1111-1111-111111111111', 1, 'available'),
    ('102', '11111111-1111-1111-1111-111111111111', 1, 'available'),
    ('201', '22222222-2222-2222-2222-222222222222', 2, 'available'),
    ('202', '22222222-2222-2222-2222-222222222222', 2, 'available'),
    ('501', '33333333-3333-3333-3333-333333333333', 5, 'available')
ON CONFLICT (room_number) DO NOTHING;
