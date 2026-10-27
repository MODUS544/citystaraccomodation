import { Request, Response, NextFunction } from 'express';
export type UserRole = 'guest' | 'receptionist' | 'staff' | 'admin' | 'super_admin';
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
export type AppRole = 'guest' | 'receptionist' | 'staff' | 'admin' | 'super_admin';
/**
 * Role-Based Access Control (RBAC) middleware factory
 * Supports super_admin full clearance and staff/receptionist hierarchy
 */
export declare function requireRole(allowedRoles: AppRole[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Super Administrator Exclusive Guard
 * Restricts revenue metrics, financial settlement logs, rate modifications, staff management, and Global CMS
 */
export declare const requireSuperAdmin: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Front-Desk Staff & Administration Guard
 * Permits front-desk staff, receptionists, admins, and super admins
 */
export declare const requireStaffOrAdmin: (req: Request, _res: Response, next: NextFunction) => void;
