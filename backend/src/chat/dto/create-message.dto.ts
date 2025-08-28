import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsUUID } from "class-validator"
import { Type } from "class-transformer"
import { MessageType } from "../../database/entities/message.entity"

class MessageAttachmentDto {

   @IsString()
  id: string

  @IsString()
  filename: string

  @IsString()
  originalName: string

  @IsString()
  mimeType: string

  @IsString()
  url: string

  @IsString()
  size: number
}

export class CreateMessageDto {
  @IsUUID("4")
  chatRoomId: string

  @IsString()
  content: string

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[]
}
