import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/api-response';
import { env } from '../config/env';

/**
 * Centralized Application Error Handling Middleware
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Known Operational AppErrors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  // 2. PostgreSQL Specific Database Error Codes
  const pgError = err as any;
  if (pgError.code) {
    switch (pgError.code) {
      // GiST exclusion constraint violation (e.g., overlapping date range double booking)
      case '23P01':
        res.status(409).json(
          errorResponse(
            'DOUBLE_BOOKING_CONFLICT',
            'The selected room is already booked for the specified dates.',
            { constraint: pgError.constraint }
          )
        );
        return;

      // Unique constraint violation (e.g. duplicate room number, email, or booking reference)
      case '23505':
        res.status(409).json(
          errorResponse(
            'DUPLICATE_RESOURCE',
            'A resource with this identifier already exists.',
            { detail: pgError.detail }
          )
        );
        return;

      // Foreign key violation
      case '23503':
        res.status(400).json(
          errorResponse(
            'FOREIGN_KEY_VIOLATION',
            'Referenced parent entity does not exist.',
            { detail: pgError.detail }
          )
        );
        return;

      // Check constraint violation
      case '23514':
        res.status(400).json(
          errorResponse(
            'CONSTRAINT_VIOLATION',
            'Operation violates database validation rules.',
            { constraint: pgError.constraint }
          )
        );
        return;
    }
  }

  // 3. Stored Procedure Exception Interception (e.g. from create_booking_atomic)
  if (err.message && err.message.includes('DOUBLE_BOOKING_CONFLICT')) {
    res.status(409).json(
      errorResponse(
        'DOUBLE_BOOKING_CONFLICT',
        'Room is already reserved for the selected date range.'
      )
    );
    return;
  }

  if (err.message && err.message.includes('INVALID_DATE_RANGE')) {
    res.status(400).json(
      errorResponse(
        'INVALID_DATE_RANGE',
        'Check-out date must be strictly after check-in date.'
      )
    );
    return;
  }

  // 4. Bad JSON payload from client
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json(
      errorResponse('INVALID_JSON', 'Malformed JSON payload received.')
    );
    return;
  }

  // 5. Unhandled Server Exceptions (HTTP 500)
  console.error('Unhandled Application Exception:', err);

  const message = env.NODE_ENV === 'production'
    ? 'An internal server error occurred. Please contact system support.'
    : err.message || 'Internal Server Error';

  res.status(500).json(
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      message,
      env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
    )
  );
}

/**
 * 404 Catch-All Route Middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    errorResponse(
      'ROUTE_NOT_FOUND',
      `Cannot ${req.method} ${req.originalUrl}`
    )
  );
}
