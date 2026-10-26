"use strict";
/**
 * Enterprise Application Error Hierarchy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyDoubleBookingError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    isOperational;
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Invalid request parameters', code = 'BAD_REQUEST', details) {
        super(message, 400, code, details);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', code = 'UNAUTHORIZED', details) {
        super(message, 401, code, details);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions to perform this action', code = 'FORBIDDEN', details) {
        super(message, 403, code, details);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Requested resource not found', code = 'NOT_FOUND', details) {
        super(message, 404, code, details);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict detected', code = 'CONFLICT', details) {
        super(message, 409, code, details);
    }
}
exports.ConflictError = ConflictError;
class ConcurrencyDoubleBookingError extends AppError {
    constructor(message = 'The requested room has already been reserved for the specified dates') {
        super(message, 409, 'DOUBLE_BOOKING_CONFLICT');
    }
}
exports.ConcurrencyDoubleBookingError = ConcurrencyDoubleBookingError;
//# sourceMappingURL=errors.js.map