import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common"
import { type Repository, In } from "typeorm"
import { ChatRoom, ChatRoomType } from "../database/entities/chat-room.entity"
import { Message } from "../database/entities/message.entity"
import { User } from "../database/entities/user.entity"
import type { CreateChatRoomDto } from "./dto/create-chat-room.dto"
import type { UpdateChatRoomDto } from "./dto/update-chat-room.dto"
import type { AddParticipantsDto } from "./dto/add-participants.dto"
import type { RemoveParticipantDto } from "./dto/remove-participant.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
     @InjectRepository(Message)
    private messageRepository: Repository<Message>,
     @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createChatRoom(createChatRoomDto: CreateChatRoomDto, creatorId: string): Promise<ChatRoom> {
    const { participantIds, type, name, description } = createChatRoomDto

    // Validate participants exist
    const participants = await this.userRepository.findBy({
      id: In([creatorId, ...participantIds]),
    })

    if (participants.length !== participantIds.length + 1) {
      throw new BadRequestException("Some participants not found")
    }

    // For direct chat, check if room already exists
    if (type === ChatRoomType.DIRECT) {
      if (participantIds.length !== 1) {
        throw new BadRequestException("Direct chat must have exactly 2 participants")
      }

      const existingRoom = await this.findDirectChatRoom(creatorId, participantIds[0])
      if (existingRoom) {
        return existingRoom
      }
    }

    // Create chat room
    const chatRoom = this.chatRoomRepository.create({
      name: type === ChatRoomType.GROUP ? name : null,
      type,
      description,
      createdBy: creatorId,
      participants,
    })

    return await this.chatRoomRepository.save(chatRoom)
  }

  async findUserChatRooms(userId: string, page = 1, limit = 20): Promise<{ chatRooms: ChatRoom[]; total: number }> {
    const [chatRooms, total] = await this.chatRoomRepository.findAndCount({
      where: {
        participants: { id: userId },
        isActive: true,
      },
      relations: ["participants", "messages"],
      order: { updatedAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get last message for each chat room
    const chatRoomsWithLastMessage = await Promise.all(
      chatRooms.map(async (room) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { chatRoomId: room.id },
          relations: ["sender"],
          order: { createdAt: "DESC" },
        })

        return {
          ...room,
          lastMessage,
          unreadCount: await this.getUnreadMessageCount(room.id, userId),
        }
      }),
    )

    return {
      chatRooms: chatRoomsWithLastMessage,
      total,
    }
  }

  async findChatRoom(id: string, userId: string): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id, isActive: true },
      relations: ["participants", "creator"],
    })

    if (!chatRoom) {
      throw new NotFoundException("Chat room not found")
    }

    // Check if user is participant
    const isParticipant = chatRoom.participants.some((participant) => participant.id === userId)
    if (!isParticipant) {
      throw new ForbiddenException("You are not a participant in this chat room")
    }

    return chatRoom
  }

  async updateChatRoom(id: string, updateChatRoomDto: UpdateChatRoomDto, userId: string): Promise<ChatRoom> {
    const chatRoom = await this.findChatRoom(id, userId)

    // Only creator or admin can update group chat details
    if (chatRoom.type === ChatRoomType.GROUP && chatRoom.createdBy !== userId) {
      throw new ForbiddenException("Only the creator can update this chat room")
    }

    // Direct chats cannot be updated
    if (chatRoom.type === ChatRoomType.DIRECT) {
      throw new BadRequestException("Direct chats cannot be updated")
    }

    Object.assign(chatRoom, updateChatRoomDto)
    return await this.chatRoomRepository.save(chatRoom)
  }

  async addParticipants(id: string, addParticipantsDto: AddParticipantsDto, userId: string): Promise<ChatRoom> {
    const chatRoom = await this.findChatRoom(id, userId)

    if (chatRoom.type === ChatRoomType.DIRECT) {
      throw new BadRequestException("Cannot add participants to direct chat")
    }

    // Only creator can add participants (you can extend this with admin roles)
    if (chatRoom.createdBy !== userId) {
      throw new ForbiddenException("Only the creator can add participants")
    }

    const newParticipants = await this.userRepository.findBy({
      id: In(addParticipantsDto.participantIds),
    })

    if (newParticipants.length !== addParticipantsDto.participantIds.length) {
      throw new BadRequestException("Some users not found")
    }

    // Filter out existing participants
    const existingParticipantIds = chatRoom.participants.map((p) => p.id)
    const participantsToAdd = newParticipants.filter((p) => !existingParticipantIds.includes(p.id))

    chatRoom.participants = [...chatRoom.participants, ...participantsToAdd]
    return await this.chatRoomRepository.save(chatRoom)
  }

  async removeParticipant(id: string, removeParticipantDto: RemoveParticipantDto, userId: string): Promise<ChatRoom> {
    const chatRoom = await this.findChatRoom(id, userId)

    if (chatRoom.type === ChatRoomType.DIRECT) {
      throw new BadRequestException("Cannot remove participants from direct chat")
    }

    const { participantId } = removeParticipantDto

    // Users can remove themselves, or creator can remove others
    if (participantId !== userId && chatRoom.createdBy !== userId) {
      throw new ForbiddenException("You can only remove yourself or you must be the creator")
    }

    chatRoom.participants = chatRoom.participants.filter((p) => p.id !== participantId)

    // If creator leaves, transfer ownership to first remaining participant
    if (participantId === chatRoom.createdBy && chatRoom.participants.length > 0) {
      chatRoom.createdBy = chatRoom.participants[0].id
    }

    // If no participants left, deactivate room
    if (chatRoom.participants.length === 0) {
      chatRoom.isActive = false
    }

    return await this.chatRoomRepository.save(chatRoom)
  }

  async leaveChatRoom(id: string, userId: string): Promise<void> {
    await this.removeParticipant(id, { participantId: userId }, userId)
  }

  async deleteChatRoom(id: string, userId: string): Promise<void> {
    const chatRoom = await this.findChatRoom(id, userId)

    // Only creator can delete group chats
    if (chatRoom.type === ChatRoomType.GROUP && chatRoom.createdBy !== userId) {
      throw new ForbiddenException("Only the creator can delete this chat room")
    }

    // For direct chats, either participant can "delete" (deactivate for them)
    if (chatRoom.type === ChatRoomType.DIRECT) {
      // In a real app, you might want to implement per-user deletion
      chatRoom.isActive = false
    } else {
      chatRoom.isActive = false
    }

    await this.chatRoomRepository.save(chatRoom)
  }

  async searchChatRooms(userId: string, query: string, page = 1, limit = 20): Promise<ChatRoom[]> {
    return await this.chatRoomRepository
      .createQueryBuilder("chatRoom")
      .innerJoin("chatRoom.participants", "participant", "participant.id = :userId", { userId })
      .leftJoinAndSelect("chatRoom.participants", "allParticipants")
      .where("chatRoom.isActive = :isActive", { isActive: true })
      .andWhere(
        "(chatRoom.name ILIKE :query OR allParticipants.username ILIKE :query OR allParticipants.email ILIKE :query)",
        { query: `%${query}%` },
      )
      .orderBy("chatRoom.updatedAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()
  }

  private async findDirectChatRoom(userId1: string, userId2: string): Promise<ChatRoom | null> {
    return await this.chatRoomRepository
      .createQueryBuilder("chatRoom")
      .innerJoin("chatRoom.participants", "p1", "p1.id = :userId1", { userId1 })
      .innerJoin("chatRoom.participants", "p2", "p2.id = :userId2", { userId2 })
      .where("chatRoom.type = :type", { type: ChatRoomType.DIRECT })
      .andWhere("chatRoom.isActive = :isActive", { isActive: true })
      .getOne()
  }

  private async getUnreadMessageCount(chatRoomId: string, userId: string): Promise<number> {
    // This would require a read_receipts table in a real implementation
    // For now, return 0
    return 0
  }

  async getChatRoomMessages(
    chatRoomId: string,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: Message[]; total: number }> {
    // Verify user has access to chat room
    await this.findChatRoom(chatRoomId, userId)

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { chatRoomId },
      relations: ["sender", "attachments"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
    }
  }
}
