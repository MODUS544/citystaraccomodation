"use strict";
/**
 * Standardized API Response Definitions
 * Conforms strictly to:
 * { success: boolean, data?: T, error?: { code: string, message: string, details?: unknown } }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(data) {
    return {
        success: true,
        data,
    };
}
function errorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            ...(details !== undefined ? { details } : {}),
        },
    };
}
//# sourceMappingURL=api-response.js.map