import { Controller, Get, Post, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from "@nestjs/common"
import type { MessagesService } from "./messages.service"
import type { CreateMessageDto } from "./dto/create-message.dto"
import type { UpdateMessageDto } from "./dto/update-message.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { RequirePermissions } from "../auth/decorators/permissions.decorator"
import type { Request } from "express"

@Controller("messages")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @RequirePermissions("chat", "create")
  createMessage(createMessageDto: CreateMessageDto, req: Request) {
    return this.messagesService.createMessage(createMessageDto, req.user.id)
  }

  @Get(":id")
  @RequirePermissions("chat", "read")
  getMessage(@Param("id", ParseUUIDPipe) id: string, req: Request) {
    return this.messagesService.getMessageById(id, req.user.id)
  }

  @Patch(":id")
  @RequirePermissions("chat", "update")
  updateMessage(@Param("id", ParseUUIDPipe) id: string, updateMessageDto: UpdateMessageDto, req: Request) {
    return this.messagesService.updateMessage(id, updateMessageDto, req.user.id)
  }

  @Delete(":id")
  @RequirePermissions("chat", "delete")
  deleteMessage(@Param("id", ParseUUIDPipe) id: string, req: Request) {
    return this.messagesService.deleteMessage(id, req.user.id)
  }

  @Post("rooms/:chatRoomId/read")
  @RequirePermissions("chat", "read")
  markAsRead(@Param("chatRoomId", ParseUUIDPipe) chatRoomId: string, req: Request) {
    return this.messagesService.markMessagesAsRead(chatRoomId, req.user.id)
  }
}
