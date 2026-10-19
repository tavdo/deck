import dotenv from 'dotenv';
import { z } from 'zod';
import { SUPPORTED_GEMINI_MODELS } from '../../shared/types.js';

dotenv.config();

const supportedModelIds = SUPPORTED_GEMINI_MODELS.map((m) => m.id) as [string, ...string[]];

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_IMAGE_MODEL: z.enum(supportedModelIds).default('gemini-nano-banana-2.1'),
  GEMINI_TIMEOUT_MS: z.coerce.number().min(5000).max(120000).default(45000),
  GEMINI_MAX_RETRIES: z.coerce.number().min(0).max(5).default(2),
  DATABASE_URL: z.string().optional().default(''),
  REDIS_URL: z.string().optional().default(''),
  QUEUE_CONCURRENCY: z.coerce.number().min(1).max(10).default(2),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional().default(''),
  S3_REGION: z.string().optional().default('us-east-1'),
  S3_BUCKET: z.string().optional().default(''),
  S3_ACCESS_KEY_ID: z.string().optional().default(''),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(''),
  S3_PUBLIC_URL_BASE: z.string().optional().default(''),
  MAX_DECK_SIZE: z.coerce.number().min(1).max(108).default(54),
  USER_DAILY_GENERATION_LIMIT: z.coerce.number().min(1).max(2000).default(200),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export const config: AppConfig = EnvSchema.parse(process.env);

export function isGeminiConfigured(): boolean {
  const key = config.GEMINI_API_KEY?.trim();
  return Boolean(key && key.length > 10 && key !== 'your_gemini_api_key_here');
}

export function isPostgresConfigured(): boolean {
  const url = config.DATABASE_URL?.trim();
  return Boolean(
    url &&
      url.startsWith('postgres') &&
      !url.includes('localhost:5432/kartuli_deck_ai')
  );
}
