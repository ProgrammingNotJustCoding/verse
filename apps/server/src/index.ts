import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { validateEnv, type Environment } from './config/env.ts'
import { createDb } from './database/db.ts'
import { createLogger } from './config/logger.ts'
import { authRouter, participantRouter, roomRouter } from './api/routes.ts'
import { cors } from 'hono/cors'
import { createLivekitService, type LivekitService } from './services/livekit.service.ts'
import { createCleanupService, type CleanupService } from './services/cleanup.service.ts'
import { createSTTAgent, type LiveKitSTTAgent } from './agent/stt-agent.ts'

type Bindings = Environment

type Variables = {
  logger: ReturnType<typeof createLogger>
  db: ReturnType<typeof createDb>
  livekit: LivekitService
}

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>().basePath('/api')

let globalLogger: ReturnType<typeof createLogger> | null = null
let globalDb: ReturnType<typeof createDb> | null = null
let globalLivekit: LivekitService | null = null
let globalCleanup: CleanupService | null = null
let globalSTTAgent: LiveKitSTTAgent | null = null
let globalEnv: Environment | null = null

if (typeof process !== 'undefined' && process.env.NODE_ENV) {
  globalEnv = validateEnv(process.env)
  globalLogger = createLogger(globalEnv)
  globalDb = createDb(globalEnv)
  globalLivekit = createLivekitService(globalEnv)

  globalCleanup = createCleanupService({
    db: globalDb,
    livekit: globalLivekit,
    logger: globalLogger,
    inactivityThresholdMinutes: 1,
  })

  globalCleanup.start()
  globalLogger.info('Cleanup service started - checking for inactive rooms every minute')

  globalSTTAgent = createSTTAgent({
    livekitUrl: globalEnv.LIVEKIT_HOST || 'http://localhost:7880',
    livekitApiKey: globalEnv.LIVEKIT_API_KEY,
    livekitApiSecret: globalEnv.LIVEKIT_SECRET_KEY,
    whisperUrl: 'http://localhost:9010',
    logger: globalLogger,
  })

  await globalSTTAgent.start()
}

app.use(cors({ origin: 'http://localhost:5173' }))

app.use('*', async (c, next) => {
  const env = c.env || globalEnv!
  const logger = globalLogger || createLogger(env)
  const db = globalDb || createDb(env)
  const livekit = globalLivekit || createLivekitService(env)

  c.set('logger', logger)
  c.set('db', db)
  c.set('livekit', livekit)

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
app.route('/rooms', roomRouter)
app.route('/participants', participantRouter)

// STT Agent control endpoints
app.post('/stt/join/:roomName', async c => {
  const logger = c.get('logger')
  const roomName = c.req.param('roomName')

  if (!globalSTTAgent) {
    logger.error('STT Agent not initialized')
    return c.json({ status: 500, message: 'STT Agent not available' }, 500)
  }

  try {
    await globalSTTAgent.joinRoom(roomName)
    logger.info({ roomName }, 'STT Agent joined room')
    return c.json({ status: 200, message: 'STT Agent joined room', roomName })
  } catch (err) {
    logger.error({ err, roomName }, 'Failed to join room with STT Agent')
    return c.json({ status: 500, message: 'Failed to join room' }, 500)
  }
})

app.post('/stt/leave/:roomName', async c => {
  const logger = c.get('logger')
  const roomName = c.req.param('roomName')

  if (!globalSTTAgent) {
    logger.error('STT Agent not initialized')
    return c.json({ status: 500, message: 'STT Agent not available' }, 500)
  }

  try {
    await globalSTTAgent.leaveRoom(roomName)
    logger.info({ roomName }, 'STT Agent left room')
    return c.json({ status: 200, message: 'STT Agent left room', roomName })
  } catch (err) {
    logger.error({ err, roomName }, 'Failed to leave room with STT Agent')
    return c.json({ status: 500, message: 'Failed to leave room' }, 500)
  }
})

app.get('/stt/status', async c => {
  const logger = c.get('logger')

  if (!globalSTTAgent) {
    logger.error('STT Agent not initialized')
    return c.json({ status: 500, message: 'STT Agent not available' }, 500)
  }

  const activeSessions = globalSTTAgent.getActiveSessions()
  return c.json({
    status: 200,
    active: true,
    activeSessions,
    sessionCount: activeSessions.length,
  })
})

// Webhook endpoint for LiveKit events (optional - for automatic joining)
app.post('/livekit/webhook', async c => {
  const logger = c.get('logger')

  try {
    const event = await c.req.json()
    logger.info({ event: event.event }, 'LiveKit webhook received')

    // Handle participant data messages for transcription control
    if (event.event === 'participant_joined') {
      const roomName = event.room?.name
      logger.info({ roomName, participant: event.participant?.identity }, 'Participant joined')
    }

    return c.json({ status: 200, message: 'Webhook processed' })
  } catch (err) {
    logger.error({ err }, 'Error processing webhook')
    return c.json({ status: 500, message: 'Error processing webhook' }, 500)
  }
})

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

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...')
    if (globalCleanup) {
      globalCleanup.stop()
    }
    if (globalSTTAgent) {
      await globalSTTAgent.stop()
    }
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...')
    if (globalCleanup) {
      globalCleanup.stop()
    }
    if (globalSTTAgent) {
      await globalSTTAgent.stop()
    }
    process.exit(0)
  })
}
