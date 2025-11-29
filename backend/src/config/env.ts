import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

// Environment variable schema with validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Financial Modeling Prep API
  FMP_API_KEY: z.string().min(1, 'FMP_API_KEY is required'),

  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('debug'),
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();

// Type export for use elsewhere
export type Env = z.infer<typeof envSchema>;
