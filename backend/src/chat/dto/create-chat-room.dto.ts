import { IsString, IsOptional, IsArray, IsUUID, IsEnum, ValidateIf, ArrayMinSize } from "class-validator"
import { ChatRoomType } from "../../database/entities/chat-room.entity"

export class CreateChatRoomDto {
  @ValidateIf((o) => o.type === ChatRoomType.GROUP)
  @IsString()
  name?: string

  @IsEnum(ChatRoomType)
  type: ChatRoomType

  @IsOptional()
  @IsString()
  description?: string

  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMinSize(1)
  participantIds: string[]
}
