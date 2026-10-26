"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const errors_1 = require("../utils/errors");
const api_response_1 = require("../utils/api-response");
const env_1 = require("../config/env");
/**
 * Centralized Application Error Handling Middleware
 */
function errorHandler(err, _req, res, _next) {
    // 1. Known Operational AppErrors
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json((0, api_response_1.errorResponse)(err.code, err.message, err.details));
        return;
    }
    // 2. PostgreSQL Specific Database Error Codes
    const pgError = err;
    if (pgError.code) {
        switch (pgError.code) {
            // GiST exclusion constraint violation (e.g., overlapping date range double booking)
            case '23P01':
                res.status(409).json((0, api_response_1.errorResponse)('DOUBLE_BOOKING_CONFLICT', 'The selected room is already booked for the specified dates.', { constraint: pgError.constraint }));
                return;
            // Unique constraint violation (e.g. duplicate room number, email, or booking reference)
            case '23505':
                res.status(409).json((0, api_response_1.errorResponse)('DUPLICATE_RESOURCE', 'A resource with this identifier already exists.', { detail: pgError.detail }));
                return;
            // Foreign key violation
            case '23503':
                res.status(400).json((0, api_response_1.errorResponse)('FOREIGN_KEY_VIOLATION', 'Referenced parent entity does not exist.', { detail: pgError.detail }));
                return;
            // Check constraint violation
            case '23514':
                res.status(400).json((0, api_response_1.errorResponse)('CONSTRAINT_VIOLATION', 'Operation violates database validation rules.', { constraint: pgError.constraint }));
                return;
        }
    }
    // 3. Stored Procedure Exception Interception (e.g. from create_booking_atomic)
    if (err.message && err.message.includes('DOUBLE_BOOKING_CONFLICT')) {
        res.status(409).json((0, api_response_1.errorResponse)('DOUBLE_BOOKING_CONFLICT', 'Room is already reserved for the selected date range.'));
        return;
    }
    if (err.message && err.message.includes('INVALID_DATE_RANGE')) {
        res.status(400).json((0, api_response_1.errorResponse)('INVALID_DATE_RANGE', 'Check-out date must be strictly after check-in date.'));
        return;
    }
    // 4. Bad JSON payload from client
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json((0, api_response_1.errorResponse)('INVALID_JSON', 'Malformed JSON payload received.'));
        return;
    }
    // 5. Unhandled Server Exceptions (HTTP 500)
    console.error('Unhandled Application Exception:', err);
    const message = env_1.env.NODE_ENV === 'production'
        ? 'An internal server error occurred. Please contact system support.'
        : err.message || 'Internal Server Error';
    res.status(500).json((0, api_response_1.errorResponse)('INTERNAL_SERVER_ERROR', message, env_1.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined));
}
/**
 * 404 Catch-All Route Middleware
 */
function notFoundHandler(req, res) {
    res.status(404).json((0, api_response_1.errorResponse)('ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`));
}
//# sourceMappingURL=error.middleware.js.map