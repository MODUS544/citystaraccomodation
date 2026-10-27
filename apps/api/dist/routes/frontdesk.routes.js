"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontdeskRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const api_response_1 = require("../utils/api-response");
const errors_1 = require("../utils/errors");
exports.frontdeskRouter = (0, express_1.Router)();
// Apply staff / admin authentication across all front-desk endpoints
exports.frontdeskRouter.use(auth_middleware_1.authenticateToken);
exports.frontdeskRouter.use(auth_middleware_1.requireStaffOrAdmin);
const walkInBookingSchema = zod_1.z.object({
    // Guest Identity & KYC
    fullName: zod_1.z.string().min(2, 'Full name is required (min 2 characters)'),
    phoneNumber: zod_1.z.string().min(5, 'Valid phone number is required'),
    email: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD format').optional().or(zod_1.z.literal('')),
    idType: zod_1.z.enum(['nin', 'national_id', 'passport', 'drivers_license', 'voters_card']),
    idNumber: zod_1.z.string().min(3, 'Official ID document number is required'),
    address: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    // Reservation details
    roomTypeId: zod_1.z.string().optional(),
    roomId: zod_1.z.string().optional(),
    checkInDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD'),
    checkOutDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD'),
    paymentMethod: zod_1.z.enum(['cash', 'pos_terminal', 'transfer', 'card_online']).default('pos_terminal'),
    autoCheckIn: zod_1.z.boolean().default(true),
    specialRequests: zod_1.z.string().max(1000).optional(),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: 'checkOutDate must be strictly after checkInDate',
    path: ['checkOutDate'],
}).refine((data) => Boolean(data.roomId || data.roomTypeId), {
    message: 'Either roomId or roomTypeId must be provided',
    path: ['roomTypeId'],
});
/**
 * GET /api/v1/frontdesk/rooms/available
 * Returns real-time available physical rooms grouped with room type pricing for walk-in selector
 */
exports.frontdeskRouter.get('/rooms/available', async (req, res, next) => {
    try {
        const { roomTypeId } = req.query;
        let query = `
      SELECT 
        r.id,
        r.id AS room_id,
        r.room_number,
        r.floor,
        r.status,
        rt.id AS room_type_id,
        rt.name AS room_type_name,
        rt.slug AS room_type_slug,
        rt.base_price_per_night,
        rt.max_occupancy
      FROM public.rooms r
      JOIN public.room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'available'
    `;
        const params = [];
        if (roomTypeId && typeof roomTypeId === 'string') {
            params.push(roomTypeId);
            query += ` AND r.room_type_id = $1`;
        }
        query += ` ORDER BY r.floor ASC, r.room_number ASC;`;
        const result = await database_1.dbPool.query(query, params);
        res.json((0, api_response_1.successResponse)(result.rows));
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/frontdesk/walk-in/lookup?query=...
 * Rapid search for existing walk-in guests by phone or ID number to auto-populate KYC form
 */
exports.frontdeskRouter.get('/walk-in/lookup', async (req, res, next) => {
    try {
        const query = req.query.query ? String(req.query.query).trim() : '';
        if (!query || query.length < 3) {
            return res.json((0, api_response_1.successResponse)([]));
        }
        const result = await database_1.dbPool.query(`SELECT * FROM public.walk_in_guests 
       WHERE phone_number ILIKE $1 OR id_number ILIKE $1 OR full_name ILIKE $1
       ORDER BY created_at DESC 
       LIMIT 10;`, [`%${query}%`]);
        res.json((0, api_response_1.successResponse)(result.rows));
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/frontdesk/walk-in
 * High-Integrity Front Desk Walk-in Booking & Instant Key Handover
 * Executes inside an atomic ACID transaction with SELECT ... FOR UPDATE SKIP LOCKED
 */
exports.frontdeskRouter.post('/walk-in', (0, validate_middleware_1.validateRequest)({ body: walkInBookingSchema }), async (req, res, next) => {
    const client = await database_1.dbPool.connect();
    try {
        await client.query('BEGIN');
        const { fullName, phoneNumber, email, dateOfBirth, idType, idNumber, address, emergencyContactName, emergencyContactPhone, roomTypeId, roomId, checkInDate, checkOutDate, paymentMethod, autoCheckIn, specialRequests, } = req.body;
        const staffUserId = req.user?.id || null;
        // 1. Upsert walk-in guest record
        let walkInGuestId;
        const existingGuest = await client.query('SELECT id FROM public.walk_in_guests WHERE id_number = $1 OR phone_number = $2 LIMIT 1', [idNumber, phoneNumber]);
        if (existingGuest.rows.length > 0) {
            walkInGuestId = existingGuest.rows[0].id;
            await client.query(`UPDATE public.walk_in_guests 
           SET full_name = $1, email = COALESCE($2, email), date_of_birth = $3, id_type = $4, id_number = $5,
               address = COALESCE($6, address), emergency_contact_name = COALESCE($7, emergency_contact_name),
               emergency_contact_phone = COALESCE($8, emergency_contact_phone)
           WHERE id = $9`, [fullName, email || null, dateOfBirth || null, idType, idNumber, address || null, emergencyContactName || null, emergencyContactPhone || null, walkInGuestId]);
        }
        else {
            const newGuest = await client.query(`INSERT INTO public.walk_in_guests (
            full_name, phone_number, email, date_of_birth, id_type, id_number, address, emergency_contact_name, emergency_contact_phone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`, [fullName, phoneNumber, email || null, dateOfBirth || null, idType, idNumber, address || null, emergencyContactName || null, emergencyContactPhone || null]);
            walkInGuestId = newGuest.rows[0].id;
        }
        // 2. Concurrency-Safe Physical Room Allocation via FOR UPDATE SKIP LOCKED
        let lockedRoomQuery;
        let queryParams;
        if (roomId) {
            lockedRoomQuery = `
          SELECT r.id, r.room_number, r.floor, rt.id as room_type_id, rt.name as room_type_name, rt.base_price_per_night
          FROM public.rooms r
          JOIN public.room_types rt ON r.room_type_id = rt.id
          WHERE r.id = $1 AND r.status = 'available'
          FOR UPDATE SKIP LOCKED;
        `;
            queryParams = [roomId];
        }
        else {
            lockedRoomQuery = `
          SELECT r.id, r.room_number, r.floor, rt.id as room_type_id, rt.name as room_type_name, rt.base_price_per_night
          FROM public.rooms r
          JOIN public.room_types rt ON r.room_type_id = rt.id
          WHERE r.room_type_id = $1 AND r.status = 'available'
          ORDER BY r.floor ASC, r.room_number ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED;
        `;
            queryParams = [roomTypeId];
        }
        const lockedRoomResult = await client.query(lockedRoomQuery, queryParams);
        if (lockedRoomResult.rows.length === 0) {
            throw new errors_1.ConcurrencyDoubleBookingError('Selected room is no longer available or was concurrently reserved by another station. Please choose another suite.');
        }
        const room = lockedRoomResult.rows[0];
        // 3. Compute duration and billing
        const checkInMs = new Date(checkInDate).getTime();
        const checkOutMs = new Date(checkOutDate).getTime();
        const totalNights = Math.max(1, Math.round((checkOutMs - checkInMs) / (1000 * 60 * 60 * 24)));
        const basePrice = parseFloat(room.base_price_per_night);
        const totalAmount = (totalNights * basePrice).toFixed(2);
        // 4. Generate custom booking reference: CH. followed by 5 uppercase letters (e.g. CH.MAVBU)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let refLetters = '';
        for (let i = 0; i < 5; i++) {
            refLetters += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        const bookingReference = `CH.${refLetters}`;
        const initialStatus = autoCheckIn ? 'checked_in' : 'confirmed';
        // 5. Insert Booking Record
        const insertBookingQuery = `
        INSERT INTO public.bookings (
          booking_reference,
          walk_in_guest_id,
          booked_by_staff_id,
          room_id,
          check_in_date,
          check_out_date,
          total_nights,
          total_amount,
          status,
          payment_method,
          special_requests,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *;
      `;
        const bookingResult = await client.query(insertBookingQuery, [
            bookingReference,
            walkInGuestId,
            staffUserId,
            room.id,
            checkInDate,
            checkOutDate,
            totalNights,
            totalAmount,
            initialStatus,
            paymentMethod,
            specialRequests || null,
        ]);
        const createdBooking = bookingResult.rows[0];
        // 6. Update physical room status if auto check-in is toggled
        if (autoCheckIn) {
            await client.query("UPDATE public.rooms SET status = 'occupied', updated_at = NOW() WHERE id = $1", [room.id]);
        }
        await client.query('COMMIT');
        res.status(201).json((0, api_response_1.successResponse)({
            ...createdBooking,
            guest_name: fullName,
            guest_phone: phoneNumber,
            guest_email: email || null,
            id_type: idType,
            id_number: idNumber,
            room_number: room.room_number,
            floor: room.floor,
            room_type_name: room.room_type_name,
            auto_checked_in: autoCheckIn,
        }));
    }
    catch (err) {
        await client.query('ROLLBACK');
        next(err);
    }
    finally {
        client.release();
    }
});
//# sourceMappingURL=frontdesk.routes.js.map