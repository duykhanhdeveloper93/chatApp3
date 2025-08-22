import {
  WebSocketGateway,
  SubscribeMessage,
  type OnGatewayInit,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets"
import { UseGuards, Logger } from "@nestjs/common"
import type { Server, Socket } from "socket.io"
import type { JwtService } from "@nestjs/jwt"
import type { ConfigService } from "@nestjs/config"

import type { MessagesService } from "./messages.service"
import type { ChatService } from "./chat.service"
import type { RedisService } from "../common/config/redis.config"
import type { RabbitMQService } from "../common/config/rabbitmq.config"
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard"
import type { CreateMessageDto } from "./dto/create-message.dto"
import type { JoinRoomDto } from "./dto/join-room.dto"
import type { TypingDto } from "./dto/typing.dto"

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string
    email: string
    username: string
  }
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:4200",
    credentials: true,
  },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger("ChatGateway")

  constructor(
    private messagesService: MessagesService,
    private chatService: ChatService,
    private redisService: RedisService,
    private rabbitMQService: RabbitMQService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized")
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        client.disconnect()
        return
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET"),
      })

      client.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      }

      // Set user online status
      await this.setUserOnlineStatus(client.user.id, true)

      // Join user to their personal room for notifications
      client.join(`user:${client.user.id}`)

      this.logger.log(`Client connected: ${client.user.username} (${client.id})`)

      // Notify user's contacts about online status
      client.broadcast.emit("user:online", {
        userId: client.user.id,
        username: client.user.username,
      })
    } catch (error) {
      this.logger.error("Authentication failed", error)
      client.disconnect()
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      // Set user offline status
      await this.setUserOnlineStatus(client.user.id, false)

      this.logger.log(`Client disconnected: ${client.user.username} (${client.id})`)

      // Notify user's contacts about offline status
      client.broadcast.emit("user:offline", {
        userId: client.user.id,
        username: client.user.username,
      })
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("join:room")
  async handleJoinRoom(joinRoomDto: JoinRoomDto, client: AuthenticatedSocket) {
    try {
      const { chatRoomId } = joinRoomDto

      // Verify user has access to chat room
      await this.chatService.findChatRoom(chatRoomId, client.user.id)

      // Join the room
      client.join(`room:${chatRoomId}`)

      // Notify others in the room
      client.to(`room:${chatRoomId}`).emit("user:joined", {
        userId: client.user.id,
        username: client.user.username,
        chatRoomId,
      })

      this.logger.log(`User ${client.user.username} joined room ${chatRoomId}`)

      return { success: true, message: "Joined room successfully" }
    } catch (error) {
      this.logger.error("Failed to join room", error)
      return { success: false, message: error.message }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("leave:room")
  async handleLeaveRoom(joinRoomDto: JoinRoomDto, client: AuthenticatedSocket) {
    const { chatRoomId } = joinRoomDto

    // Leave the room
    client.leave(`room:${chatRoomId}`)

    // Notify others in the room
    client.to(`room:${chatRoomId}`).emit("user:left", {
      userId: client.user.id,
      username: client.user.username,
      chatRoomId,
    })

    this.logger.log(`User ${client.user.username} left room ${chatRoomId}`)

    return { success: true, message: "Left room successfully" }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("send:message")
  async handleSendMessage(createMessageDto: CreateMessageDto, client: AuthenticatedSocket) {
    try {
      const message = await this.messagesService.createMessage(createMessageDto, client.user.id)

      // Emit to all users in the chat room
      this.server.to(`room:${createMessageDto.chatRoomId}`).emit("message:new", message)

      // Publish to message queue for push notifications
      await this.rabbitMQService.publishMessage("chat.events", "message.notification", {
        messageId: message.id,
        chatRoomId: createMessageDto.chatRoomId,
        senderId: client.user.id,
        senderUsername: client.user.username,
        content: createMessageDto.content,
      })

      return { success: true, message }
    } catch (error) {
      this.logger.error("Failed to send message", error)
      return { success: false, message: error.message }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("typing:start")
  async handleTypingStart(typingDto: TypingDto, client: AuthenticatedSocket) {
    const { chatRoomId } = typingDto

    // Emit to others in the room (not to sender)
    client.to(`room:${chatRoomId}`).emit("typing:start", {
      userId: client.user.id,
      username: client.user.username,
      chatRoomId,
    })

    // Set typing indicator in Redis with TTL
    await this.redisService.set(`typing:${chatRoomId}:${client.user.id}`, "true", 10)
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("typing:stop")
  async handleTypingStop(typingDto: TypingDto, client: AuthenticatedSocket) {
    const { chatRoomId } = typingDto

    // Emit to others in the room (not to sender)
    client.to(`room:${chatRoomId}`).emit("typing:stop", {
      userId: client.user.id,
      username: client.user.username,
      chatRoomId,
    })

    // Remove typing indicator from Redis
    await this.redisService.del(`typing:${chatRoomId}:${client.user.id}`)
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage("message:read")
  async handleMarkAsRead(data: { chatRoomId: string }, client: AuthenticatedSocket) {
    try {
      await this.messagesService.markMessagesAsRead(data.chatRoomId, client.user.id)

      // Notify others in the room about read receipt
      client.to(`room:${data.chatRoomId}`).emit("message:read", {
        userId: client.user.id,
        chatRoomId: data.chatRoomId,
        readAt: new Date(),
      })

      return { success: true }
    } catch (error) {
      this.logger.error("Failed to mark messages as read", error)
      return { success: false, message: error.message }
    }
  }

  // Helper method to send message to specific user
  async sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data)
  }

  // Helper method to send message to chat room
  async sendToRoom(chatRoomId: string, event: string, data: any) {
    this.server.to(`room:${chatRoomId}`).emit(event, data)
  }

  private async setUserOnlineStatus(userId: string, isOnline: boolean) {
    const key = `user:online:${userId}`
    if (isOnline) {
      await this.redisService.set(key, "true", 300) // 5 minutes TTL
    } else {
      await this.redisService.del(key)
    }
  }

  async getUserOnlineStatus(userId: string): Promise<boolean> {
    return await this.redisService.exists(`user:online:${userId}`)
  }
}
