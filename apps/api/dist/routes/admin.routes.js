"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const api_response_1 = require("../utils/api-response");
const errors_1 = require("../utils/errors");
exports.adminRouter = (0, express_1.Router)();
// Apply staff authentication across all admin endpoints
exports.adminRouter.use(auth_middleware_1.authenticateToken);
exports.adminRouter.use((0, auth_middleware_1.requireRole)(['admin', 'staff']));
// Validation Schemas
const bookingStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled']),
});
const roomStatusUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order']),
});
const bookingsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(15),
    status: zod_1.z.enum(['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']).optional(),
    startDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    search: zod_1.z.string().optional(),
});
/**
 * GET /api/v1/admin/analytics/overview
 * Real-time operational metrics: occupancy rate, revenue, today's arrivals/departures
 */
exports.adminRouter.get('/analytics/overview', async (_req, res, next) => {
    try {
        // 1. Room Occupancy Metrics
        const roomMetricsResult = await database_1.dbPool.query(`
      SELECT 
        COUNT(*)::int AS total_rooms,
        COUNT(*) FILTER (WHERE status = 'occupied')::int AS occupied_rooms,
        COUNT(*) FILTER (WHERE status = 'maintenance')::int AS maintenance_rooms,
        COUNT(*) FILTER (WHERE status = 'available')::int AS available_rooms,
        COUNT(*) FILTER (WHERE status = 'cleaning')::int AS cleaning_rooms
      FROM public.rooms;
    `);
        const roomMetrics = roomMetricsResult.rows[0];
        const totalRooms = roomMetrics.total_rooms || 1;
        const occupiedRooms = roomMetrics.occupied_rooms || 0;
        const occupancyRate = parseFloat(((occupiedRooms / totalRooms) * 100).toFixed(1));
        // 2. Today's Expected Check-ins and Check-outs
        const todayActionMetricsResult = await database_1.dbPool.query(`
      SELECT 
        COUNT(*) FILTER (
          WHERE check_in_date = CURRENT_DATE 
            AND status IN ('confirmed', 'pending')
        )::int AS check_ins_today,
        COUNT(*) FILTER (
          WHERE check_out_date = CURRENT_DATE 
            AND status = 'checked_in'
        )::int AS check_outs_today
      FROM public.bookings;
    `);
        const todayMetrics = todayActionMetricsResult.rows[0];
        // 3. Month-to-date and Year-to-date Revenue
        const revenueMetricsResult = await database_1.dbPool.query(`
      SELECT 
        COALESCE(SUM(total_amount) FILTER (
          WHERE status NOT IN ('cancelled', 'no_show')
            AND created_at >= date_trunc('month', CURRENT_DATE)
        ), 0)::numeric AS mtd_revenue,
        COALESCE(SUM(total_amount) FILTER (
          WHERE status NOT IN ('cancelled', 'no_show')
            AND created_at >= date_trunc('year', CURRENT_DATE)
        ), 0)::numeric AS ytd_revenue
      FROM public.bookings;
    `);
        const revenueMetrics = revenueMetricsResult.rows[0];
        // 4. Immediate Action List (Today's Pending Arrivals & Departures)
        const actionListResult = await database_1.dbPool.query(`
      SELECT 
        b.id,
        b.booking_reference,
        b.check_in_date,
        b.check_out_date,
        b.total_nights,
        b.total_amount,
        b.status,
        b.special_requests,
        p.full_name AS guest_name,
        p.email AS guest_email,
        p.phone_number AS guest_phone,
        r.id AS room_id,
        r.room_number,
        r.floor,
        rt.name AS room_type_name
      FROM public.bookings b
      JOIN public.profiles p ON b.guest_id = p.id
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.room_types rt ON r.room_type_id = rt.id
      WHERE (b.check_in_date = CURRENT_DATE AND b.status IN ('confirmed', 'pending'))
         OR (b.check_out_date = CURRENT_DATE AND b.status = 'checked_in')
         OR (b.check_in_date <= CURRENT_DATE AND b.check_out_date >= CURRENT_DATE AND b.status = 'checked_in')
      ORDER BY 
        CASE 
          WHEN b.check_in_date = CURRENT_DATE AND b.status IN ('confirmed', 'pending') THEN 1
          WHEN b.check_out_date = CURRENT_DATE AND b.status = 'checked_in' THEN 2
          ELSE 3
        END,
        b.check_in_date ASC
      LIMIT 20;
    `);
        res.json((0, api_response_1.successResponse)({
            kpis: {
                totalRooms: roomMetrics.total_rooms,
                occupiedRooms: roomMetrics.occupied_rooms,
                availableRooms: roomMetrics.available_rooms,
                maintenanceRooms: roomMetrics.maintenance_rooms,
                cleaningRooms: roomMetrics.cleaning_rooms,
                occupancyRate,
                checkInsToday: todayMetrics.check_ins_today,
                checkOutsToday: todayMetrics.check_outs_today,
                monthToDateRevenue: parseFloat(revenueMetrics.mtd_revenue),
                yearToDateRevenue: parseFloat(revenueMetrics.ytd_revenue),
            },
            todaysActions: actionListResult.rows,
        }));
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/v1/admin/bookings
 * Paginated reservation records with status and date filtering
 */
exports.adminRouter.get('/bookings', (0, validate_middleware_1.validateRequest)({ query: bookingsQuerySchema }), async (req, res, next) => {
    try {
        const { page, limit, status, startDate, endDate, search } = req.query;
        const offset = (page - 1) * limit;
        const conditions = ['1=1'];
        const values = [];
        let paramIndex = 1;
        if (status && status !== 'all') {
            conditions.push(`b.status = $${paramIndex++}`);
            values.push(status);
        }
        if (startDate) {
            conditions.push(`b.check_in_date >= $${paramIndex++}`);
            values.push(startDate);
        }
        if (endDate) {
            conditions.push(`b.check_out_date <= $${paramIndex++}`);
            values.push(endDate);
        }
        if (search && search.trim()) {
            conditions.push(`(
          b.booking_reference ILIKE $${paramIndex} OR
          p.full_name ILIKE $${paramIndex} OR
          p.email ILIKE $${paramIndex} OR
          r.room_number ILIKE $${paramIndex}
        )`);
            values.push(`%${search.trim()}%`);
            paramIndex++;
        }
        const whereClause = conditions.join(' AND ');
        // Query paginated rows with windowed total count
        const dataQuery = `
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
          p.id AS guest_id,
          p.full_name AS guest_name,
          p.email AS guest_email,
          p.phone_number AS guest_phone,
          r.id AS room_id,
          r.room_number,
          r.floor,
          rt.name AS room_type_name,
          COUNT(*) OVER() AS full_count
        FROM public.bookings b
        JOIN public.profiles p ON b.guest_id = p.id
        JOIN public.rooms r ON b.room_id = r.id
        JOIN public.room_types rt ON r.room_type_id = rt.id
        WHERE ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
        values.push(limit, offset);
        const result = await database_1.dbPool.query(dataQuery, values);
        const total = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
        const totalPages = Math.ceil(total / limit);
        res.json((0, api_response_1.successResponse)({
            bookings: result.rows.map(({ full_count, ...row }) => row),
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        }));
    }
    catch (err) {
        next(err);
    }
});
/**
 * PATCH /api/v1/admin/bookings/:id/status
 * Transition booking status and automatically synchronize assigned physical room status
 */
exports.adminRouter.patch('/bookings/:id/status', (0, validate_middleware_1.validateRequest)({ body: bookingStatusUpdateSchema }), async (req, res, next) => {
    const bookingId = req.params.id;
    const targetStatus = req.body.status;
    // Handle mock / preview booking updates gracefully without database errors
    if (bookingId.startsWith('mock-')) {
        return res.json((0, api_response_1.successResponse)({
            id: bookingId,
            status: targetStatus,
            updated_at: new Date().toISOString(),
        }));
    }
    const client = await database_1.dbPool.connect();
    try {
        await client.query('BEGIN');
        // 1. Fetch current booking and lock row
        const bookingCheck = await client.query('SELECT id, status, room_id FROM public.bookings WHERE id = $1 FOR UPDATE', [bookingId]);
        if (bookingCheck.rows.length === 0) {
            throw new errors_1.NotFoundError(`Booking '${bookingId}' does not exist`);
        }
        const currentBooking = bookingCheck.rows[0];
        const roomId = currentBooking.room_id;
        // 2. Perform atomic state transitions
        // Transition A: Check-In (Mark room as occupied)
        if (targetStatus === 'checked_in') {
            await client.query("UPDATE public.rooms SET status = 'occupied', updated_at = NOW() WHERE id = $1", [roomId]);
        }
        // Transition B: Check-Out (Release room back to available or cleaning)
        if (targetStatus === 'checked_out') {
            await client.query("UPDATE public.rooms SET status = 'available', updated_at = NOW() WHERE id = $1", [roomId]);
        }
        // Transition C: Cancellation (Release room hold if active)
        if (targetStatus === 'cancelled') {
            await client.query("UPDATE public.rooms SET status = 'available', updated_at = NOW() WHERE id = $1 AND status = 'occupied'", [roomId]);
        }
        // 3. Update the booking status
        const updatedBookingResult = await client.query(`UPDATE public.bookings 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`, [targetStatus, bookingId]);
        await client.query('COMMIT');
        res.json((0, api_response_1.successResponse)(updatedBookingResult.rows[0]));
    }
    catch (err) {
        await client.query('ROLLBACK');
        next(err);
    }
    finally {
        client.release();
    }
});
/**
 * GET /api/v1/admin/rooms
 * List all physical rooms with status and room type details for the inventory grid
 */
exports.adminRouter.get('/rooms', async (_req, res, next) => {
    try {
        const query = `
      SELECT 
        r.id,
        r.room_number,
        r.floor,
        r.status,
        r.notes,
        r.updated_at,
        rt.id AS room_type_id,
        rt.name AS room_type_name,
        rt.slug AS room_type_slug,
        rt.base_price_per_night,
        rt.max_occupancy
      FROM public.rooms r
      JOIN public.room_types rt ON r.room_type_id = rt.id
      ORDER BY r.floor ASC, r.room_number ASC;
    `;
        const result = await database_1.dbPool.query(query);
        res.json((0, api_response_1.successResponse)(result.rows));
    }
    catch (err) {
        next(err);
    }
});
/**
 * PATCH /api/v1/admin/rooms/:id/status
 * Allow staff to toggle physical room state (e.g. available <-> maintenance <-> cleaning)
 */
exports.adminRouter.patch('/rooms/:id/status', (0, validate_middleware_1.validateRequest)({ body: roomStatusUpdateSchema }), async (req, res, next) => {
    try {
        const roomId = req.params.id;
        const targetStatus = req.body.status;
        const result = await database_1.dbPool.query(`UPDATE public.rooms 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`, [targetStatus, roomId]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Room with ID '${roomId}' not found`);
        }
        res.json((0, api_response_1.successResponse)(result.rows[0]));
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=admin.routes.js.map