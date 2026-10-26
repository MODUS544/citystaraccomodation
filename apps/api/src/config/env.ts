import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file if available
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),

  // Supabase Configuration
  SUPABASE_URL: z.string().url().default('https://eyxorfozdtpysnsdwkib.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('dummy_anon_key_for_development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // PostgreSQL Connection Pool Strings
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/postgres'),
  DIRECT_URL: z.string().optional(),

  // Connection Pool Parameters
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('CRITICAL: Environment variable validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(` - [${issue.path.join('.')}]: ${issue.message}`);
    });
    // In production, exit immediately to prevent unstable runtime state
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return result.success ? result.data : (process.env as unknown as Env);
}

export const env = parseEnv();
