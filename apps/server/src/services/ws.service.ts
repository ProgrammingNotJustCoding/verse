import type { Server as HttpServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { Database } from '../database/db.ts'
import type { ChatService } from './chat.service.ts'
import { groupRepository } from '../database/repositories/groups.repository.ts'

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'message' | 'ping'
  groupId?: string
  content?: string
  token?: string
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  groupId?: string
  isAlive?: boolean
}

export class WebSocketService {
  private wss: WebSocketServer
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map()
  private groupRepo: ReturnType<typeof groupRepository>
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(
    private server: HttpServer,
    private db: Database,
    private chatService: ChatService,
    private jwtSecret: string
  ) {
    this.groupRepo = groupRepository(db)
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
    })

    this.setupWebSocketServer()
    this.startHeartbeat()
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: any) => {
      console.log('WebSocket connection established')

      ws.isAlive = true

      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('message', async data => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          await this.handleMessage(ws, message)
        } catch (error) {
          console.error('WebSocket message error:', error)
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            })
          )
        }
      })

      ws.on('close', () => {
        this.handleDisconnect(ws)
        console.log('WebSocket connection closed')
      })

      ws.on('error', error => {
        console.error('WebSocket error:', error)
      })

      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to chat server',
        })
      )
    })

    console.log('✓ WebSocket server started on /ws')
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'subscribe':
        await this.handleSubscribe(ws, message)
        break

      case 'unsubscribe':
        await this.handleUnsubscribe(ws, message)
        break

      case 'message':
        await this.handleChatMessage(ws, message)
        break

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }))
        break

      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
          })
        )
    }
  }

  private async handleSubscribe(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.groupId || !message.token) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Missing groupId or token',
        })
      )
      return
    }

    try {
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.verify(message.token, this.jwtSecret) as { id: string }
      const userId = decoded.id

      const isInGroup = await this.groupRepo.isUserInGroup(message.groupId, userId)
      if (!isInGroup) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Not a member of this group',
          })
        )
        return
      }

      ws.userId = userId
      ws.groupId = message.groupId

      if (!this.clients.has(message.groupId)) {
        this.clients.set(message.groupId, new Set())
      }
      this.clients.get(message.groupId)!.add(ws)

      await this.chatService.subscribeToGroup(message.groupId, chatMessage => {
        this.broadcastToGroup(message.groupId!, chatMessage)
      })

      ws.send(
        JSON.stringify({
          type: 'subscribed',
          groupId: message.groupId,
        })
      )

      console.log(`User ${userId} subscribed to group ${message.groupId}`)
    } catch (error: any) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Authentication failed',
        })
      )
    }
  }

  private async handleUnsubscribe(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.groupId || !ws.groupId) return

    const clients = this.clients.get(message.groupId)
    if (clients) {
      clients.delete(ws)
      if (clients.size === 0) {
        this.clients.delete(message.groupId)
        await this.chatService.unsubscribeFromGroup(message.groupId)
      }
    }

    ws.groupId = undefined
    ws.send(
      JSON.stringify({
        type: 'unsubscribed',
        groupId: message.groupId,
      })
    )
  }

  private async handleChatMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.userId || !ws.groupId || !message.content) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Missing userId, groupId, or content',
        })
      )
      return
    }

    try {
      await this.chatService.sendMessage(ws.groupId, ws.userId, message.content)
    } catch (error: any) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: error.message,
        })
      )
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.groupId) {
      const clients = this.clients.get(ws.groupId)
      if (clients) {
        clients.delete(ws)
        if (clients.size === 0) {
          this.clients.delete(ws.groupId)
        }
      }
    }
  }

  private broadcastToGroup(groupId: string, message: any) {
    const clients = this.clients.get(groupId)
    if (!clients) return

    const payload = JSON.stringify({
      type: 'message',
      data: message,
    })

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    })
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate()
        }
        ws.isAlive = false
        ws.ping()
      })
    }, 30000)
  }

  async stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.wss.close()
    console.log('✓ WebSocket server stopped')
  }
}

export const createWebSocketService = (
  server: HttpServer,
  db: Database,
  chatService: ChatService,
  jwtSecret: string
) => new WebSocketService(server, db, chatService, jwtSecret)
