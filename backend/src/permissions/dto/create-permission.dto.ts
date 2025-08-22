import { IsString } from "class-validator"

export class CreatePermissionDto {
  @IsString()
  name: string

  @IsString()
  resource: string

  @IsString()
  action: string

  @IsString()
  description?: string
}
