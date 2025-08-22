import { IsOptional, IsString } from "class-validator"

export class UploadFileDto {
  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  category?: string
}
