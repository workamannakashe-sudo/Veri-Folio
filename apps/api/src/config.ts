import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgresql://verifolio_app:verifolio_secret@localhost:5432/verifolio?schema=public'),
  DATABASE_ADMIN_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/verifolio?schema=public'),
  JWT_SECRET: z.string().default('development-jwt-secret-min-32-chars-long!'),
  JWT_REFRESH_SECRET: z.string().default('development-refresh-secret-min-32-chars!'),
  SEAL_KEY_ID: z.string().default('key-2026-1'),
  SEAL_PRIVATE_KEY: z.string().optional(),
  SEAL_PUBLIC_KEY: z.string().optional()
});

export const config = ConfigSchema.parse(process.env);
