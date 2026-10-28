import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file if available
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(10000),
  NODE_ENV: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase().trim() : val),
    z.enum(['development', 'test', 'production']).default('development')
  ),
  API_PREFIX: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() ? val.trim() : '/api/v1'),
    z.string().default('/api/v1')
  ),
  CORS_ORIGIN: z.string().default('*'),

  // Supabase Configuration
  SUPABASE_URL: z.preprocess(
    (val) => {
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
    },
    z.string().default('https://eyxorfozdtpysnsdwkib.supabase.co')
  ),
  SUPABASE_ANON_KEY: z.string().default('dummy_anon_key_for_development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // PostgreSQL Connection Pool Strings
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/postgres'),
  DIRECT_URL: z.string().optional(),

  // Connection Pool Parameters
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),

  // Email & SMTP Notification Parameters
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.preprocess(
    (val) => val === 'true' || val === true || val === '1' || val === undefined,
    z.boolean().default(true)
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('"City Star Hotel & Suites" <citystarmaiduguri@gmail.com>'),
  ADMIN_NOTIFICATION_EMAIL: z.string().default('talbashtech@gmail.com'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('WARN: Environment variable validation had warnings, applying resilient defaults:');
    result.error.issues.forEach((issue) => {
      console.warn(` - [${issue.path.join('.')}]: ${issue.message}`);
    });
    // Obtain guaranteed defaults
    const defaults = envSchema.parse({});
    return {
      ...defaults,
      PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : defaults.PORT,
      NODE_ENV: (process.env.NODE_ENV?.toLowerCase() as any) || defaults.NODE_ENV,
      API_PREFIX: process.env.API_PREFIX || defaults.API_PREFIX,
      DATABASE_URL: process.env.DATABASE_URL || defaults.DATABASE_URL,
      SUPABASE_URL: process.env.SUPABASE_URL || defaults.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || defaults.SUPABASE_ANON_KEY,
    };
  }
  return result.data;
}

export const env = parseEnv();
