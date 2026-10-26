import { Request, Response, NextFunction } from 'express';
import { supabase, dbPool } from '../config/database';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export type UserRole = 'guest' | 'receptionist' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

// Augment Express Request interface with authenticated user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Extracts and validates Supabase JWT Bearer tokens from incoming Authorization headers.
 * Stateless and headless-ready for Next.js and Flutter clients alike.
 */
export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new UnauthorizedError('Missing or malformed authorization header. Expected "Bearer <token>"')
    );
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return next(new UnauthorizedError('Bearer token is empty'));
  }

  try {
    // 1. Validate JWT signature and fetch authenticated user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new UnauthorizedError('Invalid or expired session token'));
    }

    // 2. Fetch role from public.profiles table using connection pool
    let role: UserRole = 'guest';
    try {
      const profileResult = await dbPool.query(
        'SELECT role FROM public.profiles WHERE id = $1 LIMIT 1',
        [user.id]
      );
      if (profileResult.rows.length > 0 && profileResult.rows[0].role) {
        role = profileResult.rows[0].role as UserRole;
      } else if (user.user_metadata?.role) {
        role = user.user_metadata.role as UserRole;
      }
    } catch {
      // Fallback to metadata if DB lookup is temporarily degraded
      if (user.user_metadata?.role) {
        role = user.user_metadata.role as UserRole;
      }
    }

    req.user = {
      id: user.id,
      email: user.email || '',
      role,
    };

    next();
  } catch (err: any) {
    next(new UnauthorizedError(`Authentication failed: ${err.message}`));
  }
}

/**
 * Optional authentication: attaches req.user if a valid token exists, but does not block unauthenticated traffic
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return next();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      let role: UserRole = 'guest';
      const profileResult = await dbPool.query(
        'SELECT role FROM public.profiles WHERE id = $1 LIMIT 1',
        [user.id]
      );
      if (profileResult.rows.length > 0) {
        role = profileResult.rows[0].role as UserRole;
      }
      req.user = { id: user.id, email: user.email || '', role };
    }
  } catch {
    // Silently continue for optional auth
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware factory
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User authentication required before role evaluation'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role "${req.user.role}" does not have required permissions [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}
