import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { Repository } from "typeorm"
import { Message, MessageType } from "../database/entities/message.entity"
import { MessageAttachment } from "../database/entities/message-attachment.entity"
import { ChatService } from "./chat.service"
import { RabbitMQService } from "../common/config/rabbitmq.config"
import { FilesService } from "../files/files.service"
import { CreateMessageDto } from "./dto/create-message.dto"
import { UpdateMessageDto } from "./dto/update-message.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
     @InjectRepository(MessageAttachment)
    private messageAttachmentRepository: Repository<MessageAttachment>,
    private chatService: ChatService,
    private rabbitMQService: RabbitMQService,
    private filesService: FilesService,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    const { chatRoomId, content, type, attachments } = createMessageDto

    // Verify user has access to chat room
    await this.chatService.findChatRoom(chatRoomId, senderId)

    // Create message
    const message = this.messageRepository.create({
      content,
      type: type || MessageType.TEXT,
      senderId,
      chatRoomId,
    })

    const savedMessage = await this.messageRepository.save(message)

    // Handle attachments if any
    if (attachments && attachments.length > 0) {
      // Validate attachment IDs exist and user has access
      const validAttachments = await this.filesService.getFilesByIds(attachments.map((a) => a.id || a.filename))

      const messageAttachments = validAttachments.map((attachment) => ({
        ...attachment,
        messageId: savedMessage.id,
      }))

      await this.messageAttachmentRepository.save(messageAttachments)
    }

    // Load complete message with relations
    const completeMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ["sender", "attachments"],
    })

    // Publish to message queue for notifications
    await this.rabbitMQService.publishMessage("chat.events", "message.sent", {
      messageId: savedMessage.id,
      chatRoomId,
      senderId,
      content,
      type,
      hasAttachments: attachments && attachments.length > 0,
    })

    return completeMessage
  }

  async updateMessage(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ["sender"],
    })

    if (!message) {
      throw new NotFoundException("Message not found")
    }

    // Only sender can edit their message
    if (message.senderId !== userId) {
      throw new ForbiddenException("You can only edit your own messages")
    }

    // Update message
    message.content = updateMessageDto.content
    message.isEdited = true
    message.editedAt = new Date()

    return await this.messageRepository.save(message)
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ["sender", "attachments"],
    })

    if (!message) {
      throw new NotFoundException("Message not found")
    }

    // Only sender can delete their message
    if (message.senderId !== userId) {
      throw new ForbiddenException("You can only delete your own messages")
    }

    // Delete associated files
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        try {
          await this.filesService.deleteFile(attachment.id)
        } catch (error) {
          console.error(`Failed to delete attachment ${attachment.id}:`, error)
        }
      }
    }

    await this.messageRepository.remove(message)
  }

  async getMessageById(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ["sender", "attachments", "chatRoom"],
    })

    if (!message) {
      throw new NotFoundException("Message not found")
    }

    // Verify user has access to the chat room
    await this.chatService.findChatRoom(message.chatRoomId, userId)

    return message
  }

  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    // Verify user has access to chat room
    await this.chatService.findChatRoom(chatRoomId, userId)

    // In a real implementation, you would update a read_receipts table
    // For now, we'll just publish an event
    await this.rabbitMQService.publishMessage("chat.events", "messages.read", {
      chatRoomId,
      userId,
      readAt: new Date(),
    })
  }
}
