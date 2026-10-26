import { Pool, PoolConfig } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Determine SSL requirement: Supabase hosted databases require SSL
const isRemoteDatabase = !env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1');

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
  ssl: isRemoteDatabase ? { rejectUnauthorized: false } : false,
};

// Singleton PostgreSQL Connection Pool
export const dbPool = new Pool(poolConfig);

dbPool.on('error', (err) => {
  console.error('CRITICAL: Unexpected error on idle PostgreSQL pool client:', err);
});

function cleanSupabaseUrl(val?: string): string {
  const fallback = 'https://eyxorfozdtpysnsdwkib.supabase.co';
  if (!val || typeof val !== 'string' || !val.trim()) return fallback;
  let cleaned = val.trim().replace(/^['"]|['"]$/g, '');
  if (cleaned.startsWith('postgresql://') || cleaned.startsWith('postgres://') || cleaned.includes('host=')) {
    return fallback;
  }
  if (!cleaned.match(/^https?:\/\//i)) {
    return `https://${cleaned}`;
  }
  return cleaned;
}

const safeSupabaseUrl = cleanSupabaseUrl(env.SUPABASE_URL);
const safeAnonKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'dummy_anon_key').trim().replace(/^['"]|['"]$/g, '');

// Supabase JavaScript Client (Stateless Auth & Storage SDK)
export const supabase = createClient(
  safeSupabaseUrl,
  safeAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const start = process.hrtime();
  try {
    const client = await dbPool.connect();
    try {
      await client.query('SELECT 1 AS alive');
    } finally {
      client.release();
    }
    const [seconds, nanoseconds] = process.hrtime(start);
    const latencyMs = Math.round(seconds * 1000 + nanoseconds / 1e6);

    return {
      status: 'connected',
      latencyMs,
      activeConnections: dbPool.totalCount - dbPool.idleCount,
      idleConnections: dbPool.idleCount,
      totalConnections: dbPool.totalCount,
    };
  } catch (err: any) {
    const [seconds, nanoseconds] = process.hrtime(start);
    const latencyMs = Math.round(seconds * 1000 + nanoseconds / 1e6);

    return {
      status: 'disconnected',
      latencyMs,
      activeConnections: dbPool.totalCount - dbPool.idleCount,
      idleConnections: dbPool.idleCount,
      totalConnections: dbPool.totalCount,
      error: err.message || 'Failed to query database',
    };
  }
}

/**
 * Graceful pool teardown for deployment lifecycle
 */
export async function closeDatabasePool(): Promise<void> {
  try {
    console.log('Draining PostgreSQL connection pool...');
    await dbPool.end();
    console.log('PostgreSQL connection pool terminated successfully.');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }
}
