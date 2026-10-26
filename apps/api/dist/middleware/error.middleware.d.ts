import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
/**
 * Centralized Application Error Handling Middleware
 */
export declare function errorHandler(err: Error | AppError, _req: Request, res: Response, _next: NextFunction): void;
/**
 * 404 Catch-All Route Middleware
 */
export declare function notFoundHandler(req: Request, res: Response): void;
