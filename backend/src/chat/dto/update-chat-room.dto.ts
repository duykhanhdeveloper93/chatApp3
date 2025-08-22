import { IsString, IsOptional, IsBoolean } from "class-validator"

export class UpdateChatRoomDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  avatar?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
