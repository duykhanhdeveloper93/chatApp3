import { IsUUID } from "class-validator"

export class RemoveParticipantDto {
  @IsUUID("4")
  participantId: string
}
