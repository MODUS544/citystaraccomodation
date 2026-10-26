import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbPool } from '../config/database';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { successResponse } from '../utils/api-response';
import { BadRequestError, NotFoundError, ForbiddenError, ConcurrencyDoubleBookingError } from '../utils/errors';

export const bookingsRouter = Router();

// Validation Schemas
const createBookingSchema = z.object({
  roomId: z.string().uuid('Invalid roomId UUID format'),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD format'),
  specialRequests: z.string().max(1000).optional(),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
  message: 'checkOutDate must be strictly after checkInDate',
  path: ['checkOutDate'],
});

/**
 * POST /api/v1/bookings
 * Protected: Atomically reserve a room with row-level locking
 */
bookingsRouter.post(
  '/',
  authenticateToken,
  validateRequest({ body: createBookingSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await dbPool.connect();
    try {
      const { roomId, checkInDate, checkOutDate, specialRequests } = req.body;
      const guestId = req.user!.id;

      // 1. Calculate duration in nights
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (totalNights <= 0) {
        throw new BadRequestError('Duration must be at least 1 night');
      }

      // 2. Fetch room and room type price
      const roomCheck = await client.query(
        `SELECT r.id, r.status, rt.base_price_per_night 
         FROM public.rooms r
         JOIN public.room_types rt ON r.room_type_id = rt.id
         WHERE r.id = $1`,
        [roomId]
      );

      if (roomCheck.rows.length === 0) {
        throw new NotFoundError('Selected room does not exist');
      }

      const roomData = roomCheck.rows[0];
      const basePrice = parseFloat(roomData.base_price_per_night);
      const totalAmount = parseFloat((basePrice * totalNights).toFixed(2));

      // 3. Execute atomic reservation stored function
      // This performs SELECT FOR UPDATE on the room row inside the database transaction
      const reservationResult = await client.query(
        `SELECT * FROM public.create_booking_atomic(
          $1::uuid,
          $2::uuid,
          $3::date,
          $4::date,
          $5::numeric,
          $6::text
        )`,
        [guestId, roomId, checkInDate, checkOutDate, totalAmount, specialRequests || null]
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
 * Protected: Retrieve single booking by reference code
 */
bookingsRouter.get(
  '/:reference',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reference } = req.params;
      const user = req.user!;

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
        WHERE b.booking_reference = $1
        LIMIT 1
      `;
      const result = await dbPool.query(query, [reference]);

      if (result.rows.length === 0) {
        throw new NotFoundError(`Booking reference '${reference}' not found`);
      }

      const booking = result.rows[0];

      // Authorization guard: Guests may only view their own reservations; staff may view any
      if (user.role === 'guest' && booking.guest_id !== user.id) {
        throw new ForbiddenError('You do not have permission to view this reservation');
      }

      res.json(successResponse(booking));
    } catch (err) {
      next(err);
    }
  }
);
