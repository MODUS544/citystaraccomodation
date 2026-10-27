import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { dbPool } from '../config/database';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { successResponse } from '../utils/api-response';
import { BadRequestError, NotFoundError, ConcurrencyDoubleBookingError } from '../utils/errors';

export const frontdeskRouter = Router();

// Apply staff / admin authentication across all front-desk endpoints
frontdeskRouter.use(authenticateToken);
frontdeskRouter.use(requireStaffOrAdmin);

const walkInBookingSchema = z.object({
  // Guest Identity & KYC
  fullName: z.string().min(2, 'Full name is required (min 2 characters)'),
  phoneNumber: z.string().min(5, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD format').optional().or(z.literal('')),
  idType: z.enum(['nin', 'national_id', 'passport', 'drivers_license', 'voters_card']),
  idNumber: z.string().min(3, 'Official ID document number is required'),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  // Reservation details
  roomTypeId: z.string().optional(),
  roomId: z.string().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD'),
  paymentMethod: z.enum(['cash', 'pos_terminal', 'transfer', 'card_online']).default('pos_terminal'),
  autoCheckIn: z.boolean().default(true),
  specialRequests: z.string().max(1000).optional(),
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
frontdeskRouter.get('/rooms/available', async (req: Request, res: Response, next: NextFunction) => {
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
    const params: any[] = [];
    if (roomTypeId && typeof roomTypeId === 'string') {
      params.push(roomTypeId);
      query += ` AND r.room_type_id = $1`;
    }
    query += ` ORDER BY r.floor ASC, r.room_number ASC;`;

    const result = await dbPool.query(query, params);
    res.json(successResponse(result.rows));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/frontdesk/walk-in/lookup?query=...
 * Rapid search for existing walk-in guests by phone or ID number to auto-populate KYC form
 */
frontdeskRouter.get('/walk-in/lookup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.query ? String(req.query.query).trim() : '';
    if (!query || query.length < 3) {
      return res.json(successResponse([]));
    }

    const result = await dbPool.query(
      `SELECT * FROM public.walk_in_guests 
       WHERE phone_number ILIKE $1 OR id_number ILIKE $1 OR full_name ILIKE $1
       ORDER BY created_at DESC 
       LIMIT 10;`,
      [`%${query}%`]
    );

    res.json(successResponse(result.rows));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/frontdesk/walk-in
 * High-Integrity Front Desk Walk-in Booking & Instant Key Handover
 * Executes inside an atomic ACID transaction with SELECT ... FOR UPDATE SKIP LOCKED
 */
frontdeskRouter.post(
  '/walk-in',
  validateRequest({ body: walkInBookingSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await dbPool.connect();

    try {
      await client.query('BEGIN');

      const {
        fullName,
        phoneNumber,
        email,
        dateOfBirth,
        idType,
        idNumber,
        address,
        emergencyContactName,
        emergencyContactPhone,
        roomTypeId,
        roomId,
        checkInDate,
        checkOutDate,
        paymentMethod,
        autoCheckIn,
        specialRequests,
      } = req.body;

      const staffUserId = req.user?.id || null;

      // 1. Upsert walk-in guest record
      let walkInGuestId: string;
      const existingGuest = await client.query(
        'SELECT id FROM public.walk_in_guests WHERE id_number = $1 OR phone_number = $2 LIMIT 1',
        [idNumber, phoneNumber]
      );

      if (existingGuest.rows.length > 0) {
        walkInGuestId = existingGuest.rows[0].id;
        await client.query(
          `UPDATE public.walk_in_guests 
           SET full_name = $1, email = COALESCE($2, email), date_of_birth = $3, id_type = $4, id_number = $5,
               address = COALESCE($6, address), emergency_contact_name = COALESCE($7, emergency_contact_name),
               emergency_contact_phone = COALESCE($8, emergency_contact_phone)
           WHERE id = $9`,
          [fullName, email || null, dateOfBirth || null, idType, idNumber, address || null, emergencyContactName || null, emergencyContactPhone || null, walkInGuestId]
        );
      } else {
        const newGuest = await client.query(
          `INSERT INTO public.walk_in_guests (
            full_name, phone_number, email, date_of_birth, id_type, id_number, address, emergency_contact_name, emergency_contact_phone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [fullName, phoneNumber, email || null, dateOfBirth || null, idType, idNumber, address || null, emergencyContactName || null, emergencyContactPhone || null]
        );
        walkInGuestId = newGuest.rows[0].id;
      }

      // 2. Concurrency-Safe Physical Room Allocation via FOR UPDATE SKIP LOCKED
      let lockedRoomQuery: string;
      let queryParams: any[];

      if (roomId) {
        lockedRoomQuery = `
          SELECT r.id, r.room_number, r.floor, rt.id as room_type_id, rt.name as room_type_name, rt.base_price_per_night
          FROM public.rooms r
          JOIN public.room_types rt ON r.room_type_id = rt.id
          WHERE r.id = $1 AND r.status = 'available'
          FOR UPDATE SKIP LOCKED;
        `;
        queryParams = [roomId];
      } else {
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
        throw new ConcurrencyDoubleBookingError(
          'Selected room is no longer available or was concurrently reserved by another station. Please choose another suite.'
        );
      }

      const room = lockedRoomResult.rows[0];

      // 3. Compute duration and billing
      const checkInMs = new Date(checkInDate).getTime();
      const checkOutMs = new Date(checkOutDate).getTime();
      const totalNights = Math.max(1, Math.round((checkOutMs - checkInMs) / (1000 * 60 * 60 * 24)));
      const basePrice = parseFloat(room.base_price_per_night);
      const totalAmount = (totalNights * basePrice).toFixed(2);

      // 4. Generate human-readable booking reference
      const dateSegment = checkInDate.replace(/-/g, '');
      const hexSegment = crypto.randomBytes(3).toString('hex').toUpperCase();
      const bookingReference = `CSH-${dateSegment}-${hexSegment}`;

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
        await client.query(
          "UPDATE public.rooms SET status = 'occupied', updated_at = NOW() WHERE id = $1",
          [room.id]
        );
      }

      await client.query('COMMIT');

      res.status(201).json(
        successResponse({
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
        })
      );
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);
