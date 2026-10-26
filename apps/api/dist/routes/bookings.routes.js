"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const api_response_1 = require("../utils/api-response");
const errors_1 = require("../utils/errors");
exports.bookingsRouter = (0, express_1.Router)();
// Validation Schemas
const createBookingSchema = zod_1.z.object({
    roomId: zod_1.z.string().optional(),
    roomTypeId: zod_1.z.string().optional(),
    checkInDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD format'),
    checkOutDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD format'),
    specialRequests: zod_1.z.string().max(1000).optional(),
    guestName: zod_1.z.string().optional(),
    guestEmail: zod_1.z.string().email().optional(),
    guestPhone: zod_1.z.string().optional(),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: 'checkOutDate must be strictly after checkInDate',
    path: ['checkOutDate'],
});
/**
 * POST /api/v1/bookings
 * Public & Guest Friendly: Atomically reserve a room with row-level locking
 */
exports.bookingsRouter.post('/', auth_middleware_1.optionalAuthenticate, (0, validate_middleware_1.validateRequest)({ body: createBookingSchema }), async (req, res, next) => {
    const client = await database_1.dbPool.connect();
    try {
        const { roomId, roomTypeId, checkInDate, checkOutDate, specialRequests, guestName, guestEmail, guestPhone } = req.body;
        const targetIdentifier = roomId || roomTypeId;
        if (!targetIdentifier) {
            throw new errors_1.BadRequestError('Either roomId or roomTypeId must be provided');
        }
        // 1. Resolve guest identity (from auth session or auto-provision guest profile)
        let guestId;
        if (req.user?.id) {
            guestId = req.user.id;
        }
        else {
            const email = guestEmail || 'guest@citystarhotel.com';
            const name = guestName || email.split('@')[0];
            const phone = guestPhone || null;
            // Check if profile exists for this email
            const existingProf = await client.query('SELECT id FROM public.profiles WHERE email = $1 LIMIT 1', [email]);
            if (existingProf.rows.length > 0) {
                guestId = existingProf.rows[0].id;
            }
            else {
                // Provision a new guest account in auth.users and public.profiles
                const newUserIdRes = await client.query('SELECT gen_random_uuid() AS id;');
                const newUserId = newUserIdRes.rows[0].id;
                await client.query(`
            INSERT INTO auth.users (
              instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
              raw_app_meta_data, raw_user_meta_data, created_at, updated_at
            ) VALUES (
              '00000000-0000-0000-0000-000000000000', $1::uuid, 'authenticated', 'authenticated',
              $2::text, crypt('GuestPass2026!', gen_salt('bf')), now(),
              jsonb_build_object('provider', 'email', 'providers', array['email']),
              jsonb_build_object('full_name', $3::text, 'phone_number', $4::text),
              now(), now()
            );
          `, [newUserId, email, name, phone]);
                await client.query(`
            INSERT INTO public.profiles (id, email, full_name, phone_number, role, created_at, updated_at)
            VALUES ($1::uuid, $2::text, $3::text, $4::text, 'guest', now(), now())
            ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone_number = EXCLUDED.phone_number;
          `, [newUserId, email, name, phone]);
                guestId = newUserId;
            }
        }
        // 2. Calculate duration in nights
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diffTime = checkOut.getTime() - checkIn.getTime();
        const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (totalNights <= 0) {
            throw new errors_1.BadRequestError('Duration must be at least 1 night');
        }
        // 3. Find an available physical room matching the target room or room type
        // Collision-detection: ensure no overlapping active bookings exist for requested dates
        const roomQueryResult = await client.query(`
        SELECT r.id, r.room_number, r.status, rt.base_price_per_night, rt.name AS room_type_name
        FROM public.rooms r
        JOIN public.room_types rt ON r.room_type_id = rt.id
        WHERE (r.id = $1::uuid OR r.room_type_id = $1::uuid)
          AND r.status NOT IN ('maintenance', 'out_of_order')
          AND NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.room_id = r.id
              AND b.status NOT IN ('cancelled', 'no_show', 'checked_out')
              AND daterange(b.check_in_date, b.check_out_date, '[)') && daterange($2::date, $3::date, '[)')
          )
        ORDER BY (r.status = 'available') DESC, r.room_number ASC
        LIMIT 1;
      `, [targetIdentifier, checkInDate, checkOutDate]);
        if (roomQueryResult.rows.length === 0) {
            // Check if the room category exists
            const categoryExists = await client.query('SELECT id FROM public.room_types WHERE id = $1::uuid UNION SELECT id FROM public.rooms WHERE id = $1::uuid LIMIT 1', [targetIdentifier]);
            if (categoryExists.rows.length > 0) {
                throw new errors_1.ConcurrencyDoubleBookingError('All rooms of this category are occupied for the selected dates. Please choose alternative dates or suites.');
            }
            throw new errors_1.NotFoundError('Selected room category does not exist');
        }
        const assignedRoom = roomQueryResult.rows[0];
        const basePrice = parseFloat(assignedRoom.base_price_per_night);
        const totalAmount = parseFloat((basePrice * totalNights).toFixed(2));
        // 4. Execute atomic reservation stored function with row-level lock
        const reservationResult = await client.query(`SELECT * FROM public.create_booking_atomic(
          $1::uuid,
          $2::uuid,
          $3::date,
          $4::date,
          $5::numeric,
          $6::text
        )`, [guestId, assignedRoom.id, checkInDate, checkOutDate, totalAmount, specialRequests || null]);
        const newBooking = reservationResult.rows[0];
        res.status(201).json((0, api_response_1.successResponse)(newBooking));
    }
    catch (err) {
        if (err.code === '23P01' || (err.message && err.message.includes('DOUBLE_BOOKING_CONFLICT'))) {
            return next(new errors_1.ConcurrencyDoubleBookingError());
        }
        next(err);
    }
    finally {
        client.release();
    }
});
/**
 * GET /api/v1/bookings/my
 * Protected: Retrieve all bookings for currently authenticated guest
 */
exports.bookingsRouter.get('/my', auth_middleware_1.authenticateToken, async (req, res, next) => {
    try {
        const guestId = req.user.id;
        const query = `
        SELECT 
          b.id,
          b.booking_reference,
          b.check_in_date,
          b.check_out_date,
          b.total_nights,
          b.total_amount,
          b.status,
          b.special_requests,
          b.created_at,
          r.room_number,
          r.floor,
          rt.name AS room_type_name,
          rt.slug AS room_type_slug,
          rt.images AS room_images
        FROM public.bookings b
        JOIN public.rooms r ON b.room_id = r.id
        JOIN public.room_types rt ON r.room_type_id = rt.id
        WHERE b.guest_id = $1
        ORDER BY b.created_at DESC
      `;
        const result = await database_1.dbPool.query(query, [guestId]);
        res.json((0, api_response_1.successResponse)(result.rows));
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/bookings/:reference
 * Retrieve single booking by reference code (guest lookup / manage reservation)
 */
exports.bookingsRouter.get('/:reference', auth_middleware_1.optionalAuthenticate, async (req, res, next) => {
    try {
        const { reference } = req.params;
        const query = `
        SELECT 
          b.id,
          b.booking_reference,
          b.guest_id,
          b.check_in_date,
          b.check_out_date,
          b.total_nights,
          b.total_amount,
          b.status,
          b.special_requests,
          b.created_at,
          r.room_number,
          r.floor,
          rt.name AS room_type_name,
          p.full_name AS guest_name,
          p.email AS guest_email,
          p.phone_number AS guest_phone
        FROM public.bookings b
        JOIN public.profiles p ON b.guest_id = p.id
        JOIN public.rooms r ON b.room_id = r.id
        JOIN public.room_types rt ON r.room_type_id = rt.id
        WHERE UPPER(TRIM(b.booking_reference)) = UPPER(TRIM($1))
        LIMIT 1
      `;
        const result = await database_1.dbPool.query(query, [reference]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Booking reference '${reference}' not found`);
        }
        const booking = result.rows[0];
        res.json((0, api_response_1.successResponse)(booking));
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=bookings.routes.js.map