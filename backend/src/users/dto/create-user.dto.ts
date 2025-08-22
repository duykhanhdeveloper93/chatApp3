import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from "class-validator"

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string

  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  avatar?: string
}
