import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbPool } from '../config/database';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateToken, optionalAuthenticate, requireRole } from '../middleware/auth.middleware';
import { successResponse } from '../utils/api-response';
import { BadRequestError, NotFoundError, ForbiddenError, ConcurrencyDoubleBookingError } from '../utils/errors';

export const bookingsRouter = Router();

// Validation Schemas
const createBookingSchema = z.object({
  roomId: z.string().optional(),
  roomTypeId: z.string().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD format'),
  specialRequests: z.string().max(1000).optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
  message: 'checkOutDate must be strictly after checkInDate',
  path: ['checkOutDate'],
});

/**
 * POST /api/v1/bookings
 * Public & Guest Friendly: Atomically reserve a room with row-level locking
 */
bookingsRouter.post(
  '/',
  optionalAuthenticate,
  validateRequest({ body: createBookingSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await dbPool.connect();
    try {
      const { roomId, roomTypeId, checkInDate, checkOutDate, specialRequests, guestName, guestEmail, guestPhone } = req.body;
      const targetIdentifier = roomId || roomTypeId;

      if (!targetIdentifier) {
        throw new BadRequestError('Either roomId or roomTypeId must be provided');
      }

      // 1. Resolve guest identity (from auth session or auto-provision guest profile)
      let guestId: string;
      if (req.user?.id) {
        guestId = req.user.id;
      } else {
        const email = guestEmail || 'guest@citystarhotel.com';
        const name = guestName || email.split('@')[0];
        const phone = guestPhone || null;

        // Check if user already exists in auth.users or profiles
        const existingAuthUser = await client.query('SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1', [email]);
        if (existingAuthUser.rows.length > 0) {
          guestId = existingAuthUser.rows[0].id;
          await client.query(`
            INSERT INTO public.profiles (id, email, full_name, phone_number, role, created_at, updated_at)
            VALUES ($1::uuid, $2::text, $3::text, $4::text, 'customer', now(), now())
            ON CONFLICT (id) DO UPDATE SET 
              full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
              phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
              updated_at = now();
          `, [guestId, email, name, phone]);
        } else {
          const existingProf = await client.query('SELECT id FROM public.profiles WHERE lower(email) = lower($1) LIMIT 1', [email]);
          if (existingProf.rows.length > 0) {
            guestId = existingProf.rows[0].id;
          } else {
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
              VALUES ($1::uuid, $2::text, $3::text, $4::text, 'customer', now(), now())
              ON CONFLICT (id) DO UPDATE SET 
                full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
                phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
                updated_at = now();
            `, [newUserId, email, name, phone]);

            guestId = newUserId;
          }
        }
      }

      // 2. Calculate duration in nights
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (totalNights <= 0) {
        throw new BadRequestError('Duration must be at least 1 night');
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
        const categoryExists = await client.query(
          'SELECT id FROM public.room_types WHERE id = $1::uuid UNION SELECT id FROM public.rooms WHERE id = $1::uuid LIMIT 1',
          [targetIdentifier]
        );
        if (categoryExists.rows.length > 0) {
          throw new ConcurrencyDoubleBookingError('All rooms of this category are occupied for the selected dates. Please choose alternative dates or suites.');
        }
        throw new NotFoundError('Selected room category does not exist');
      }

      const assignedRoom = roomQueryResult.rows[0];
      const basePrice = parseFloat(assignedRoom.base_price_per_night);
      const totalAmount = parseFloat((basePrice * totalNights).toFixed(2));

      // 4. Execute atomic reservation stored function with row-level lock
      const reservationResult = await client.query(
        `SELECT * FROM public.create_booking_atomic(
          $1::uuid,
          $2::uuid,
          $3::date,
          $4::date,
          $5::numeric,
          $6::text,
          $7::text,
          $8::text,
          $9::text
        )`,
        [
          guestId,
          assignedRoom.id,
          checkInDate,
          checkOutDate,
          totalAmount,
          specialRequests || null,
          guestName || null,
          guestEmail || null,
          guestPhone || null,
        ]
      );

      const newBooking = reservationResult.rows[0];
      res.status(201).json(successResponse(newBooking));
    } catch (err: any) {
      if (err.code === '23P01' || (err.message && err.message.includes('DOUBLE_BOOKING_CONFLICT'))) {
        return next(new ConcurrencyDoubleBookingError());
      }
      next(err);
    } finally {
      client.release();
    }
  }
);

/**
 * GET /api/v1/bookings/my
 * Protected: Retrieve all bookings for currently authenticated guest
 */
bookingsRouter.get(
  '/my',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guestId = req.user!.id;
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
      const result = await dbPool.query(query, [guestId]);
      res.json(successResponse(result.rows));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/bookings/:reference
 * Retrieve single booking by reference code (guest lookup / manage reservation)
 */
bookingsRouter.get(
  '/:reference',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference } = req.params;

      const query = `
        SELECT 
          b.id,
          b.booking_reference,
          COALESCE(b.booking_code, b.booking_reference) AS booking_code,
          b.guest_id,
          b.check_in_date,
          b.check_out_date,
          b.total_nights,
          b.total_amount,
          b.status,
          COALESCE(b.payment_status, 'unpaid') AS payment_status,
          b.special_requests,
          b.created_at,
          r.room_number,
          r.floor,
          rt.name AS room_type_name,
          COALESCE(b.guest_name, p.full_name, wig.full_name, 'Valued Guest') AS guest_name,
          COALESCE(b.guest_email, p.email, wig.email, '') AS guest_email,
          COALESCE(b.guest_phone, p.phone_number, wig.phone_number, '') AS guest_phone
        FROM public.bookings b
        LEFT JOIN public.profiles p ON b.guest_id = p.id
        LEFT JOIN public.walk_in_guests wig ON b.walk_in_guest_id = wig.id
        JOIN public.rooms r ON b.room_id = r.id
        JOIN public.room_types rt ON r.room_type_id = rt.id
        WHERE UPPER(TRIM(b.booking_reference)) = UPPER(TRIM($1))
           OR UPPER(TRIM(COALESCE(b.booking_code, ''))) = UPPER(TRIM($1))
        LIMIT 1
      `;
      const result = await dbPool.query(query, [reference]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Booking reference '${reference}' not found`);
      }

      const booking = result.rows[0];
      res.json(successResponse(booking));
    } catch (err) {
      next(err);
    }
  }
);
