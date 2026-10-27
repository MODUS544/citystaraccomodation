-- Migration: 20261027000001_custom_booking_reference.sql
-- Description: Update booking reference format to CH.XXXXX with exactly 5 uppercase letters (e.g. CH.MAVBU)

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
    -- 1. Acquire row-level lock on targeted room
    SELECT * INTO v_room_record
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ROOM_NOT_FOUND: Room % does not exist', p_room_id
            USING ERRCODE = 'P0002';
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

    -- 3. Generate custom booking reference: CH. followed by 5 uppercase letters (e.g. CH.MAVBU)
    LOOP
        v_booking_ref := 'CH.' || array_to_string(ARRAY(
            SELECT chr((65 + floor(random() * 26))::integer)
            FROM generate_series(1, 5)
        ), '');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_reference = v_booking_ref);
    END LOOP;

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
