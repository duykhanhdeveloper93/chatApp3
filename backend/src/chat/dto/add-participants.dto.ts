import { IsArray, IsUUID, ArrayMinSize } from "class-validator"

export class AddParticipantsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMinSize(1)
  participantIds: string[]
}
