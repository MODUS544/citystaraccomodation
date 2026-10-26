/**
 * Enterprise Application Error Hierarchy
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: unknown;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string, details?: unknown, isOperational?: boolean);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, code?: string, details?: unknown);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string, details?: unknown);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string, details?: unknown);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string, details?: unknown);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string, details?: unknown);
}
export declare class ConcurrencyDoubleBookingError extends AppError {
    constructor(message?: string);
}
