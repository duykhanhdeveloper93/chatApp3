import { IsUUID } from "class-validator"

export class JoinRoomDto {
  @IsUUID("4")
  chatRoomId: string
}
