"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file if available
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(10000),
    NODE_ENV: zod_1.z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase().trim() : val), zod_1.z.enum(['development', 'test', 'production']).default('development')),
    API_PREFIX: zod_1.z.preprocess((val) => (typeof val === 'string' && val.trim() ? val.trim() : '/api/v1'), zod_1.z.string().default('/api/v1')),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    // Supabase Configuration
    SUPABASE_URL: zod_1.z.preprocess((val) => {
        const fallback = 'https://eyxorfozdtpysnsdwkib.supabase.co';
        if (!val || typeof val !== 'string' || !val.trim())
            return fallback;
        let cleaned = val.trim().replace(/^['"]|['"]$/g, '');
        if (cleaned.startsWith('postgresql://') || cleaned.startsWith('postgres://') || cleaned.includes('host=')) {
            return fallback;
        }
        if (!cleaned.match(/^https?:\/\//i)) {
            return `https://${cleaned}`;
        }
        return cleaned;
    }, zod_1.z.string().default('https://eyxorfozdtpysnsdwkib.supabase.co')),
    SUPABASE_ANON_KEY: zod_1.z.string().default('dummy_anon_key_for_development'),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().optional(),
    SUPABASE_JWT_SECRET: zod_1.z.string().optional(),
    // PostgreSQL Connection Pool Strings
    DATABASE_URL: zod_1.z.string().default('postgresql://postgres:postgres@localhost:5432/postgres'),
    DIRECT_URL: zod_1.z.string().optional(),
    // Connection Pool Parameters
    DB_POOL_MAX: zod_1.z.coerce.number().default(10),
    DB_POOL_IDLE_TIMEOUT_MS: zod_1.z.coerce.number().default(30000),
    DB_POOL_CONNECTION_TIMEOUT_MS: zod_1.z.coerce.number().default(5000),
    // Resend & SMTP Notification Parameters
    RESEND_API_KEY: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().default('smtp.resend.com'),
    SMTP_PORT: zod_1.z.coerce.number().default(465),
    SMTP_SECURE: zod_1.z.preprocess((val) => val === 'true' || val === true || val === '1' || val === undefined, zod_1.z.boolean().default(true)),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().default('"City Star Hotel & Suites" <onboarding@resend.dev>'),
    ADMIN_NOTIFICATION_EMAIL: zod_1.z.string().default('talbashtech@gmail.com'),
});
function parseEnv() {
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
            NODE_ENV: process.env.NODE_ENV?.toLowerCase() || defaults.NODE_ENV,
            API_PREFIX: process.env.API_PREFIX || defaults.API_PREFIX,
            DATABASE_URL: process.env.DATABASE_URL || defaults.DATABASE_URL,
            SUPABASE_URL: process.env.SUPABASE_URL || defaults.SUPABASE_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || defaults.SUPABASE_ANON_KEY,
        };
    }
    return result.data;
}
exports.env = parseEnv();
//# sourceMappingURL=env.js.map