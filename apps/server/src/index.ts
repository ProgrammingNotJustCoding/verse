import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { validateEnv, type Environment } from './config/env.ts'
import { createDb } from './database/db.ts'
import { createLogger } from './config/logger.ts'
import { authRouter } from './api/routes.ts'

type Bindings = Environment

type Variables = {
  logger: ReturnType<typeof createLogger>
  db: ReturnType<typeof createDb>
}

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>().basePath('/api')

let globalLogger: ReturnType<typeof createLogger> | null = null
let globalDb: ReturnType<typeof createDb> | null = null
let globalEnv: Environment | null = null

if (typeof process !== 'undefined' && process.env.NODE_ENV) {
  globalEnv = validateEnv(process.env)
  globalLogger = createLogger(globalEnv)
  globalDb = createDb(globalEnv)
}

app.use('*', async (c, next) => {
  const env = c.env || globalEnv!
  const logger = globalLogger || createLogger(env)
  const db = globalDb || createDb(env)

  c.set('logger', logger)
  c.set('db', db)

  logger.info({ method: c.req.method, url: c.req.url }, 'Request received')

  await next()
})

app.get('/health', c => {
  const logger = c.get('logger')
  logger.info('Health check endpoint hit')

  return c.json({
    status: 200,
    message: 'Server is running!',
  })
})

app.route('/auth', authRouter)

app.notFound(c => {
  const logger = c.get('logger') || globalLogger
  logger?.warn({ method: c.req.method, url: c.req.url }, 'Route not found')
  return c.json({ status: 404, message: 'Not Found' }, 404)
})

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  serve(
    {
      fetch: app.fetch,
      port: 8000,
    },
    info => {
      console.log(`🚀 Server is running on http://localhost:${info.port}`)
    }
  )
}
