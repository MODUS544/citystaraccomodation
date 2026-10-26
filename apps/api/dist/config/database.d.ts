import { Pool } from 'pg';
export declare const dbPool: Pool;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface DatabaseHealthStatus {
    status: 'connected' | 'disconnected';
    latencyMs: number;
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    error?: string;
}
/**
 * Health check probe for PostgreSQL pooler
 */
export declare function checkDatabaseHealth(): Promise<DatabaseHealthStatus>;
/**
 * Graceful pool teardown for deployment lifecycle
 */
export declare function closeDatabasePool(): Promise<void>;
