const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// Load .env file from backend directory or fallback to parent
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // Database
    MONGO_URI: z.string({
      required_error: 'MONGO_URI is required',
    }).min(1, 'MONGO_URI cannot be empty'),

    // JWT
    JWT_SECRET: z.string({
      required_error: 'JWT_SECRET is required',
    }).min(16, 'JWT_SECRET must be at least 16 characters for security'),
    REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters').optional(),

    // AI Services
    GEMINI_API_KEY: z.string({
      required_error: 'GEMINI_API_KEY is required',
    }).min(1, 'GEMINI_API_KEY cannot be empty'),

    // Firebase (optional credentials in dev, but validated if provided)
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const origins = data.CORS_ORIGIN.split(',').map((s) => s.trim());
    if (origins.length === 0 || origins.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Wildcard * is strictly forbidden in CORS_ORIGIN',
      });
      return;
    }

    for (const originStr of origins) {
      let u;
      try {
        u = new URL(originStr);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: `Invalid origin URL: "${originStr}"`,
        });
        return;
      }

      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: `Origin must use http or https protocol: "${originStr}"`,
        });
        return;
      }

      if (u.pathname !== '/' && u.pathname !== '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: `Origin cannot contain path components: "${originStr}"`,
        });
        return;
      }

      if (u.search !== '' || u.hash !== '' || u.username !== '' || u.password !== '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: `Origin cannot contain query strings, hashes, or credentials: "${originStr}"`,
        });
        return;
      }

      // In production, compare exact parsed hostname without brackets against localhost aliases
      if (data.NODE_ENV === 'production') {
        const normalizedHost = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
        const exactLocalHosts = ['localhost', '127.0.0.1', '::1'];
        if (exactLocalHosts.includes(normalizedHost)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['CORS_ORIGIN'],
            message: `In production, localhost origins are forbidden: "${originStr}"`,
          });
          return;
        }
      }
    }
  });

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => {
      const field = err.path.join('.');
      return `  - ${field}: ${err.message}`;
    });

    // Explicitly fail fast without leaking secret values
    console.error('CRITICAL: Environment variable validation failed:');
    console.error(errorMessages.join('\n'));
    console.error('\nPlease check your .env file against .env.example.\n');
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  // If REFRESH_TOKEN_SECRET not specified, fallback to JWT_SECRET
  const validatedEnv = result.data;
  if (!validatedEnv.REFRESH_TOKEN_SECRET) {
    validatedEnv.REFRESH_TOKEN_SECRET = validatedEnv.JWT_SECRET;
  }

  return validatedEnv;
};

const env = parseEnv();
env.envSchema = envSchema;

module.exports = env;
