import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { validateEnv, type Environment } from './config/env.ts'
import { createDb } from './database/db.ts'
import { createLogger } from './config/logger.ts'
import {
  authRouter,
  participantRouter,
  roomRouter,
  groupRouter,
  meetingRouter,
  chatRouter,
} from './api/routes.ts'
import { cors } from 'hono/cors'
import { createLivekitService, type LivekitService } from './services/livekit.service.ts'
import { CleanupService, createCleanupService } from './services/cleanup.service.ts'
import { createRedisProvider, type RedisProviderType } from './providers/redis.provider.ts'
import { createChatService } from './services/chat.service.ts'
import { createWebSocketService } from './services/ws.service.ts'

type Bindings = Environment

type Variables = {
  logger: ReturnType<typeof createLogger>
  db: ReturnType<typeof createDb>
  livekit: LivekitService
  redis: RedisProviderType
  chat: ReturnType<typeof createChatService>
  userId: string
}

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>().basePath('/api')

let globalLogger: ReturnType<typeof createLogger> | null = null
let globalDb: ReturnType<typeof createDb> | null = null
let globalLivekit: LivekitService | null = null
let globalRedis: RedisProviderType | null = null
let globalChat: ReturnType<typeof createChatService> | null = null
let globalCleanup: CleanupService | null = null
let globalEnv: Environment | null = null
let globalWs: ReturnType<typeof createWebSocketService> | null = null

if (typeof process !== 'undefined' && process.env.NODE_ENV) {
  globalEnv = validateEnv(process.env)
  globalLogger = createLogger(globalEnv)
  globalDb = createDb(globalEnv)
  globalLivekit = createLivekitService(globalEnv)

  globalRedis = createRedisProvider(globalEnv)
  await globalRedis.connect()

  globalChat = createChatService(globalDb, globalRedis)
  await globalChat.start()

  globalCleanup = createCleanupService({
    db: globalDb,
    livekit: globalLivekit,
    logger: globalLogger,
    inactivityThresholdMinutes: 1,
  })

  globalCleanup.start()
  globalLogger.info('Cleanup service started - checking for inactive rooms every minute')
}

app.use(cors({ origin: 'http://localhost:5173' }))

app.use('*', async (c, next) => {
  const env = c.env || globalEnv!
  const logger = globalLogger || createLogger(env)
  const db = globalDb || createDb(env)
  const livekit = globalLivekit || createLivekitService(env)
  const redis = globalRedis!
  const chat = globalChat!

  c.set('logger', logger)
  c.set('db', db)
  c.set('livekit', livekit)
  c.set('redis', redis)
  c.set('chat', chat)

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
app.route('/groups', groupRouter)
app.route('/meetings', meetingRouter)
app.route('/chat', chatRouter)
app.route('/rooms', roomRouter)
app.route('/participants', participantRouter)

app.notFound(c => {
  const logger = c.get('logger')
  logger?.warn({ method: c.req.method, url: c.req.url }, 'Route not found')
  return c.json({ status: 404, message: 'Not Found' }, 404)
})

if (typeof process !== 'undefined' && process.env.NODE_ENV) {
  const port = process.env.NODE_ENV === 'development' ? 8000 : 3000
  const hostname = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0'

  const server = serve(
    {
      fetch: app.fetch,
      port: port,
      hostname: hostname,
    },
    info => {
      console.log(`🚀 Server is running on http://${hostname}:${info.port}`)
      globalLogger?.info(`HTTP server listening on ${hostname}:${info.port}`)
    }
  )

  if (globalDb && globalChat && globalEnv) {
    const httpServer = server as any as import('http').Server
    globalWs = createWebSocketService(httpServer, globalDb, globalChat, globalEnv.JWT_SECRET)
  }

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...')
    if (globalChat) await globalChat.stop()
    if (globalWs) await globalWs.stop()
    if (globalRedis) await globalRedis.disconnect()
    process.exit(0)
  })
}
