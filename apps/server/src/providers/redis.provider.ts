import { createClient, type RedisClientType } from 'redis'
import type { Environment } from '../config/env.ts'

export class RedisProvider {
  private client: RedisClientType
  private pubClient: RedisClientType
  private subClient: RedisClientType
  private isConnected = false

  constructor(private env: Environment) {
    const redisUrl = env.REDIS_URL || 'redis://localhost:6379'

    this.client = createClient({ url: redisUrl })
    this.pubClient = this.client.duplicate()
    this.subClient = this.client.duplicate()

    this.setupErrorHandlers()
  }

  private setupErrorHandlers() {
    this.client.on('error', err => console.error('Redis Client Error:', err))
    this.pubClient.on('error', err => console.error('Redis Pub Error:', err))
    this.subClient.on('error', err => console.error('Redis Sub Error:', err))
  }

  async connect() {
    if (this.isConnected) return

    await Promise.all([this.client.connect(), this.pubClient.connect(), this.subClient.connect()])

    this.isConnected = true
    console.log('✓ Redis connected')
  }

  async disconnect() {
    if (!this.isConnected) return

    await Promise.all([
      this.client.disconnect(),
      this.pubClient.disconnect(),
      this.subClient.disconnect(),
    ])

    this.isConnected = false
  }

  getClient() {
    return this.client
  }
  getPubClient() {
    return this.pubClient
  }
  getSubClient() {
    return this.subClient
  }
}

export const createRedisProvider = (env: Environment) => new RedisProvider(env)
export type RedisProviderType = RedisProvider
