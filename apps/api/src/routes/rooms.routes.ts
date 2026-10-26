import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbPool } from '../config/database';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { successResponse } from '../utils/api-response';
import { BadRequestError, NotFoundError } from '../utils/errors';

export const roomsRouter = Router();

// Validation Schemas
const checkAvailabilitySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD format'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD format'),
  guests: z.coerce.number().int().min(1).default(1),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: 'checkOut date must be strictly after checkIn date',
  path: ['checkOut'],
});

const createRoomTypeSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),
  basePricePerNight: z.number().positive(),
  maxOccupancy: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
});

/**
 * GET /api/v1/rooms/types
 * Public: List active room types
 */
roomsRouter.get('/types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `
      SELECT id, name, slug, description, base_price_per_night, max_occupancy, amenities, images
      FROM public.room_types
      WHERE is_active = true
      ORDER BY base_price_per_night ASC
    `;
    const result = await dbPool.query(query);
    res.json(successResponse(result.rows));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rooms/types/:slug
 * Public: Get room type details by slug
 */
roomsRouter.get('/types/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = `
      SELECT id, name, slug, description, base_price_per_night, max_occupancy, amenities, images
      FROM public.room_types
      WHERE slug = $1 AND is_active = true
      LIMIT 1
    `;
    const result = await dbPool.query(query, [req.params.slug]);
    if (result.rows.length === 0) {
      throw new NotFoundError(`Room type with slug '${req.params.slug}' not found`);
    }
    res.json(successResponse(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rooms/available
 * Public: Query rooms available for given date window and occupancy
 */
roomsRouter.get(
  '/available',
  validateRequest({ query: checkAvailabilitySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { checkIn, checkOut, guests } = req.query as any;

      const query = `
        SELECT 
          r.id,
          r.room_number,
          r.floor,
          r.status,
          rt.id AS room_type_id,
          rt.name AS room_type_name,
          rt.slug AS room_type_slug,
          rt.base_price_per_night,
          rt.max_occupancy,
          rt.amenities,
          rt.images
        FROM public.rooms r
        JOIN public.room_types rt ON r.room_type_id = rt.id
        WHERE r.status = 'available'
          AND rt.is_active = true
          AND rt.max_occupancy >= $1
          AND r.id NOT IN (
            SELECT b.room_id
            FROM public.bookings b
            WHERE b.status NOT IN ('cancelled', 'no_show')
              AND daterange(b.check_in_date, b.check_out_date, '[)') && daterange($2::date, $3::date, '[)')
          )
        ORDER BY rt.base_price_per_night ASC, r.room_number ASC
      `;

      const result = await dbPool.query(query, [guests, checkIn, checkOut]);
      res.json(successResponse(result.rows));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/rooms/types
 * Protected: Admin only - create a new room type
 */
roomsRouter.post(
  '/types',
  authenticateToken,
  requireRole(['admin']),
  validateRequest({ body: createRoomTypeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, slug, description, basePricePerNight, maxOccupancy, amenities, images } = req.body;
      const query = `
        INSERT INTO public.room_types (name, slug, description, base_price_per_night, max_occupancy, amenities, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await dbPool.query(query, [
        name,
        slug,
        description || null,
        basePricePerNight,
        maxOccupancy,
        JSON.stringify(amenities),
        JSON.stringify(images),
      ]);
      res.status(201).json(successResponse(result.rows[0]));
    } catch (err) {
      next(err);
    }
  }
);
