/**
 * Standardized API Response Definitions
 * Conforms strictly to:
 * { success: boolean, data?: T, error?: { code: string, message: string, details?: unknown } }
 */
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}
export interface ApiErrorPayload {
    code: string;
    message: string;
    details?: unknown;
}
export interface ApiErrorResponse {
    success: false;
    error: ApiErrorPayload;
}
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export declare function successResponse<T>(data: T): ApiSuccessResponse<T>;
export declare function errorResponse(code: string, message: string, details?: unknown): ApiErrorResponse;
