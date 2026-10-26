import { Request, Response, NextFunction } from 'express';
export type UserRole = 'guest' | 'receptionist' | 'admin';
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}
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
export declare function authenticateToken(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Optional authentication: attaches req.user if a valid token exists, but does not block unauthenticated traffic
 */
export declare function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
export type AppRole = 'guest' | 'receptionist' | 'admin' | 'staff';
/**
 * Role-Based Access Control (RBAC) middleware factory
 * Supports 'staff' as an alias matching either 'receptionist' or 'admin'
 */
export declare function requireRole(allowedRoles: AppRole[]): (req: Request, _res: Response, next: NextFunction) => void;
