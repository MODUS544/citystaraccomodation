"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireRole = requireRole;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
/**
 * Extracts and validates Supabase JWT Bearer tokens from incoming Authorization headers.
 * Stateless and headless-ready for Next.js and Flutter clients alike.
 */
async function authenticateToken(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new errors_1.UnauthorizedError('Missing or malformed authorization header. Expected "Bearer <token>"'));
    }
    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
        return next(new errors_1.UnauthorizedError('Bearer token is empty'));
    }
    try {
        // 1. Validate JWT signature and fetch authenticated user from Supabase Auth
        const { data: { user }, error } = await database_1.supabase.auth.getUser(token);
        if (error || !user) {
            return next(new errors_1.UnauthorizedError('Invalid or expired session token'));
        }
        // 2. Fetch role from public.profiles table using connection pool
        let role = 'guest';
        try {
            const profileResult = await database_1.dbPool.query('SELECT role FROM public.profiles WHERE id = $1 LIMIT 1', [user.id]);
            if (profileResult.rows.length > 0 && profileResult.rows[0].role) {
                role = profileResult.rows[0].role;
            }
            else if (user.user_metadata?.role) {
                role = user.user_metadata.role;
            }
        }
        catch {
            // Fallback to metadata if DB lookup is temporarily degraded
            if (user.user_metadata?.role) {
                role = user.user_metadata.role;
            }
        }
        req.user = {
            id: user.id,
            email: user.email || '',
            role,
        };
        next();
    }
    catch (err) {
        next(new errors_1.UnauthorizedError(`Authentication failed: ${err.message}`));
    }
}
/**
 * Optional authentication: attaches req.user if a valid token exists, but does not block unauthenticated traffic
 */
async function optionalAuthenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
        return next();
    }
    try {
        const { data: { user } } = await database_1.supabase.auth.getUser(token);
        if (user) {
            let role = 'guest';
            const profileResult = await database_1.dbPool.query('SELECT role FROM public.profiles WHERE id = $1 LIMIT 1', [user.id]);
            if (profileResult.rows.length > 0) {
                role = profileResult.rows[0].role;
            }
            req.user = { id: user.id, email: user.email || '', role };
        }
    }
    catch {
        // Silently continue for optional auth
    }
    next();
}
/**
 * Role-Based Access Control (RBAC) middleware factory
 */
function requireRole(allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('User authentication required before role evaluation'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError(`Access denied. Role "${req.user.role}" does not have required permissions [${allowedRoles.join(', ')}]`));
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map