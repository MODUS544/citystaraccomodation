"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const api_response_1 = require("../utils/api-response");
const errors_1 = require("../utils/errors");
exports.roomsRouter = (0, express_1.Router)();
// Validation Schemas
const checkAvailabilitySchema = zod_1.z.object({
    checkIn: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD format'),
    checkOut: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD format'),
    guests: zod_1.z.coerce.number().int().min(1).default(1),
}).refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: 'checkOut date must be strictly after checkIn date',
    path: ['checkOut'],
});
const createRoomTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    slug: zod_1.z.string().min(3),
    description: zod_1.z.string().optional(),
    basePricePerNight: zod_1.z.number().positive(),
    maxOccupancy: zod_1.z.number().int().positive(),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    images: zod_1.z.array(zod_1.z.string().url()).default([]),
});
/**
 * GET /api/v1/rooms/types
 * Public: List active room types
 */
exports.roomsRouter.get('/types', async (_req, res, next) => {
    try {
        const query = `
      SELECT id, name, slug, description, base_price_per_night, max_occupancy, amenities, images
      FROM public.room_types
      WHERE is_active = true
      ORDER BY base_price_per_night ASC
    `;
        const result = await database_1.dbPool.query(query);
        res.json((0, api_response_1.successResponse)(result.rows));
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/rooms/types/:slug
 * Public: Get room type details by slug
 */
exports.roomsRouter.get('/types/:slug', async (req, res, next) => {
    try {
        const query = `
      SELECT id, name, slug, description, base_price_per_night, max_occupancy, amenities, images
      FROM public.room_types
      WHERE slug = $1 AND is_active = true
      LIMIT 1
    `;
        const result = await database_1.dbPool.query(query, [req.params.slug]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Room type with slug '${req.params.slug}' not found`);
        }
        res.json((0, api_response_1.successResponse)(result.rows[0]));
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/rooms/available
 * Public: Query rooms available for given date window and occupancy
 */
exports.roomsRouter.get('/available', (0, validate_middleware_1.validateRequest)({ query: checkAvailabilitySchema }), async (req, res, next) => {
    try {
        const { checkIn, checkOut, guests } = req.query;
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
        const result = await database_1.dbPool.query(query, [guests, checkIn, checkOut]);
        res.json((0, api_response_1.successResponse)(result.rows));
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/v1/rooms/types
 * Protected: Admin only - create a new room type
 */
exports.roomsRouter.post('/types', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['admin']), (0, validate_middleware_1.validateRequest)({ body: createRoomTypeSchema }), async (req, res, next) => {
    try {
        const { name, slug, description, basePricePerNight, maxOccupancy, amenities, images } = req.body;
        const query = `
        INSERT INTO public.room_types (name, slug, description, base_price_per_night, max_occupancy, amenities, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
        const result = await database_1.dbPool.query(query, [
            name,
            slug,
            description || null,
            basePricePerNight,
            maxOccupancy,
            JSON.stringify(amenities),
            JSON.stringify(images),
        ]);
        res.status(201).json((0, api_response_1.successResponse)(result.rows[0]));
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=rooms.routes.js.map