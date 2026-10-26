"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.dbPool = void 0;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.closeDatabasePool = closeDatabasePool;
const pg_1 = require("pg");
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
// Determine SSL requirement: Supabase hosted databases require SSL
const isRemoteDatabase = !env_1.env.DATABASE_URL.includes('localhost') && !env_1.env.DATABASE_URL.includes('127.0.0.1');
const poolConfig = {
    connectionString: env_1.env.DATABASE_URL,
    max: env_1.env.DB_POOL_MAX,
    idleTimeoutMillis: env_1.env.DB_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env_1.env.DB_POOL_CONNECTION_TIMEOUT_MS,
    ssl: isRemoteDatabase ? { rejectUnauthorized: false } : false,
};
// Singleton PostgreSQL Connection Pool
exports.dbPool = new pg_1.Pool(poolConfig);
exports.dbPool.on('error', (err) => {
    console.error('CRITICAL: Unexpected error on idle PostgreSQL pool client:', err);
});
// Supabase JavaScript Client (Stateless Auth & Storage SDK)
exports.supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY || env_1.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
/**
 * Health check probe for PostgreSQL pooler
 */
async function checkDatabaseHealth() {
    const start = process.hrtime();
    try {
        const client = await exports.dbPool.connect();
        try {
            await client.query('SELECT 1 AS alive');
        }
        finally {
            client.release();
        }
        const [seconds, nanoseconds] = process.hrtime(start);
        const latencyMs = Math.round(seconds * 1000 + nanoseconds / 1e6);
        return {
            status: 'connected',
            latencyMs,
            activeConnections: exports.dbPool.totalCount - exports.dbPool.idleCount,
            idleConnections: exports.dbPool.idleCount,
            totalConnections: exports.dbPool.totalCount,
        };
    }
    catch (err) {
        const [seconds, nanoseconds] = process.hrtime(start);
        const latencyMs = Math.round(seconds * 1000 + nanoseconds / 1e6);
        return {
            status: 'disconnected',
            latencyMs,
            activeConnections: exports.dbPool.totalCount - exports.dbPool.idleCount,
            idleConnections: exports.dbPool.idleCount,
            totalConnections: exports.dbPool.totalCount,
            error: err.message || 'Failed to query database',
        };
    }
}
/**
 * Graceful pool teardown for deployment lifecycle
 */
async function closeDatabasePool() {
    try {
        console.log('Draining PostgreSQL connection pool...');
        await exports.dbPool.end();
        console.log('PostgreSQL connection pool terminated successfully.');
    }
    catch (err) {
        console.error('Error closing database pool:', err);
    }
}
//# sourceMappingURL=database.js.map