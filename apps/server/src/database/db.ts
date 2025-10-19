import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { type Environment } from '../config/env.ts'

export function createDb(env: Environment) {
  let url = env.DATABASE_URL

  const client = postgres(url)

  return drizzle(client)
}

export type Database = ReturnType<typeof createDb>
