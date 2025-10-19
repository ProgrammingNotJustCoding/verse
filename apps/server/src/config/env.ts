import { z } from 'zod'
import { config } from 'dotenv'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgres://verse:verse-secret@localhost:5432/verse_db'),
  JWT_SECRET: z.string().min(1),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

export type Environment = z.infer<typeof envSchema>

export function validateEnv(env?: unknown): Environment {
  const envToValidate = env || process.env
  return envSchema.parse(envToValidate)
}
