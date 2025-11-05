import type { Database } from '../database/db.ts'
import type { RedisProviderType } from '../providers/redis.provider.ts'
import { messageRepository } from '../database/repositories/messages.repository.ts'
import { groupRepository } from '../database/repositories/groups.repository.ts'
import type { NewMessage } from '../database/repositories/messages.repository.ts'

interface ChatMessage {
  id: string
  groupId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  type: 'message' | 'meeting_started' | 'meeting_ended'
  meetingId?: string
  createdAt: string
}

export class ChatService {
  private messageRepo: ReturnType<typeof messageRepository>
  private groupRepo: ReturnType<typeof groupRepository>
  private redis: RedisProviderType
  private flushInterval: NodeJS.Timeout | null = null
  private messageBuffer: Map<string, NewMessage[]> = new Map()
  private readonly BATCH_SIZE = 50
  private readonly FLUSH_INTERVAL_MS = 5000

  constructor(
    private db: Database,
    redis: RedisProviderType
  ) {
    this.messageRepo = messageRepository(db)
    this.groupRepo = groupRepository(db)
    this.redis = redis
  }

  async start() {
    this.flushInterval = setInterval(() => {
      this.flushMessagesToDb()
    }, this.FLUSH_INTERVAL_MS)

    console.log('✓ Chat service started')
  }

  async stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    await this.flushMessagesToDb()
    console.log('✓ Chat service stopped')
  }

  async sendMessage(
    groupId: string,
    userId: string,
    content: string,
    type: 'message' | 'meeting_started' | 'meeting_ended' = 'message',
    meetingId?: string
  ): Promise<ChatMessage> {
    const isInGroup = await this.groupRepo.isUserInGroup(groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    const members = await this.groupRepo.getGroupMembers(groupId)
    const user = members.find(m => m.userId === userId)
    if (!user) {
      throw new Error('User not found in group')
    }

    const messageId = crypto.randomUUID()
    const now = new Date()

    const chatMessage: ChatMessage = {
      id: messageId,
      groupId,
      userId,
      userName: user.userName,
      userEmail: user.userEmail,
      content,
      type,
      meetingId,
      createdAt: now.toISOString(),
    }

    const streamKey = `chat:queue:${groupId}`
    await this.redis.getClient().xAdd(streamKey, '*', {
      id: messageId,
      groupId,
      userId,
      content,
      type,
      meetingId: meetingId || '',
      createdAt: now.toISOString(),
    })

    const channelKey = `chat:channel:${groupId}`
    await this.redis.getPubClient().publish(channelKey, JSON.stringify(chatMessage))

    if (!this.messageBuffer.has(groupId)) {
      this.messageBuffer.set(groupId, [])
    }
    this.messageBuffer.get(groupId)!.push({
      groupId,
      userId,
      content,
      type,
      meetingId,
      createdAt: now,
    })

    const buffer = this.messageBuffer.get(groupId)!
    if (buffer.length >= this.BATCH_SIZE) {
      await this.flushGroupMessages(groupId)
    }

    return chatMessage
  }

  async getGroupMessages(groupId: string, userId: string, limit = 100) {
    const isInGroup = await this.groupRepo.isUserInGroup(groupId, userId)
    if (!isInGroup) {
      throw new Error('User not in group')
    }

    return await this.messageRepo.getGroupMessages(groupId, limit)
  }

  private async flushMessagesToDb() {
    const groupIds = Array.from(this.messageBuffer.keys())

    for (const groupId of groupIds) {
      await this.flushGroupMessages(groupId)
    }
  }

  private async flushGroupMessages(groupId: string) {
    const messages = this.messageBuffer.get(groupId)
    if (!messages || messages.length === 0) return

    try {
      for (const msg of messages) {
        await this.messageRepo.create(msg)
      }

      this.messageBuffer.delete(groupId)

      console.log(`✓ Flushed ${messages.length} messages for group ${groupId}`)
    } catch (error) {
      console.error('Failed to flush messages:', error)
    }
  }

  async subscribeToGroup(groupId: string, callback: (message: ChatMessage) => void) {
    const channelKey = `chat:channel:${groupId}`

    await this.redis.getSubClient().subscribe(channelKey, rawMessage => {
      const message: ChatMessage = JSON.parse(rawMessage)
      callback(message)
    })
  }

  async unsubscribeFromGroup(groupId: string) {
    const channelKey = `chat:channel:${groupId}`
    await this.redis.getSubClient().unsubscribe(channelKey)
  }
}

export const createChatService = (db: Database, redis: RedisProviderType) =>
  new ChatService(db, redis)
