import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from "@nestjs/common"
import type { ChatService } from "./chat.service"
import type { CreateChatRoomDto } from "./dto/create-chat-room.dto"
import type { UpdateChatRoomDto } from "./dto/update-chat-room.dto"
import type { AddParticipantsDto } from "./dto/add-participants.dto"
import type { RemoveParticipantDto } from "./dto/remove-participant.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { RequirePermissions } from "../auth/decorators/permissions.decorator"

@Controller("chat")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("rooms")
  @RequirePermissions("chat", "create")
  createChatRoom(createChatRoomDto: CreateChatRoomDto, @Request() req) {
    return this.chatService.createChatRoom(createChatRoomDto, req.user.id)
  }

  @Get("rooms")
  @RequirePermissions("chat", "read")
  getUserChatRooms(
    @Request() req,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.chatService.findUserChatRooms(req.user.id, page, limit)
  }

  @Get("rooms/search")
  @RequirePermissions("chat", "read")
  searchChatRooms(
    @Request() req,
    @Query("q") query: string,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.chatService.searchChatRooms(req.user.id, query, page, limit)
  }

  @Get("rooms/:id")
  @RequirePermissions("chat", "read")
  getChatRoom(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.chatService.findChatRoom(id, req.user.id)
  }

  @Get("rooms/:id/messages")
  @RequirePermissions("chat", "read")
  getChatRoomMessages(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return this.chatService.getChatRoomMessages(id, req.user.id, page, limit)
  }

  @Patch("rooms/:id")
  @RequirePermissions("chat", "update")
  updateChatRoom(@Param("id", ParseUUIDPipe) id: string, updateChatRoomDto: UpdateChatRoomDto, @Request() req) {
    return this.chatService.updateChatRoom(id, updateChatRoomDto, req.user.id)
  }

  @Post("rooms/:id/participants")
  @RequirePermissions("chat", "update")
  addParticipants(@Param("id", ParseUUIDPipe) id: string, addParticipantsDto: AddParticipantsDto, @Request() req) {
    return this.chatService.addParticipants(id, addParticipantsDto, req.user.id)
  }

  @Delete("rooms/:id/participants")
  @RequirePermissions("chat", "update")
  removeParticipant(
    @Param("id", ParseUUIDPipe) id: string,
    removeParticipantDto: RemoveParticipantDto,
    @Request() req,
  ) {
    return this.chatService.removeParticipant(id, removeParticipantDto, req.user.id)
  }

  @Post("rooms/:id/leave")
  @RequirePermissions("chat", "update")
  leaveChatRoom(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.chatService.leaveChatRoom(id, req.user.id)
  }

  @Delete("rooms/:id")
  @RequirePermissions("chat", "delete")
  deleteChatRoom(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.chatService.deleteChatRoom(id, req.user.id)
  }
}
