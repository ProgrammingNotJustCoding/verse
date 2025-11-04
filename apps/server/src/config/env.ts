import { z } from 'zod'
import { config } from 'dotenv'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().min(1).default('8000'),
  DATABASE_URL: z.string().default('postgres://verse:verse-secret@localhost:5432/verse_db'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(1),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  LIVEKIT_HOST: z.string().min(1).default('localhost:7880'),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_SECRET_KEY: z.string().min(1),
})

export type Environment = z.infer<typeof envSchema>

export function validateEnv(env?: unknown): Environment {
  const envToValidate = env || process.env
  return envSchema.parse(envToValidate)
}
