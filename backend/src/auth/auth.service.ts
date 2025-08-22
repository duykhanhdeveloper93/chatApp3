import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"
import type { ConfigService } from "@nestjs/config"
import { Repository } from "typeorm"
import { v4 as uuidv4 } from "uuid"

import type { UsersService } from "../users/users.service"
import type { RedisService } from "../common/config/redis.config"
import type { User } from "../database/entities/user.entity"
import type { RegisterDto } from "./dto/register.dto"
import type { LoginDto } from "./dto/login.dto"
import type { RefreshTokenDto } from "./dto/refresh-token.dto"
import type { ForgotPasswordDto } from "./dto/forgot-password.dto"
import type { ResetPasswordDto } from "./dto/reset-password.dto"

export interface JwtPayload {
  sub: string
  email: string
  username: string
  permissions: string[]
}

export interface AuthResponse {
  user: Partial<User>
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  private usersRepository: Repository<User>

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.usersRepository = new Repository<User>()
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email)
    if (user && (await this.usersService.validatePassword(user, password))) {
      return user
    }
    return null
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    })

    if (existingUser) {
      throw new ConflictException("User with this email or username already exists")
    }

    const user = await this.usersService.create(registerDto)
    const tokens = await this.generateTokens(user)

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    if (!user) {
      throw new UnauthorizedException("Invalid credentials")
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated")
    }

    // Update last seen
    await this.usersService.updateLastSeen(user.id)

    const tokens = await this.generateTokens(user)

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken } = refreshTokenDto

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("JWT_REFRESH_SECRET") || this.configService.get("JWT_SECRET"),
      })

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.redisService.exists(`blacklist:${refreshToken}`)
      if (isBlacklisted) {
        throw new UnauthorizedException("Refresh token is invalid")
      }

      const user = await this.usersService.findOne(payload.sub)
      if (!user || !user.isActive) {
        throw new UnauthorizedException("User not found or inactive")
      }

      // Blacklist old refresh token
      await this.redisService.set(`blacklist:${refreshToken}`, "true", 7 * 24 * 60 * 60) // 7 days

      const tokens = await this.generateTokens(user)

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      }
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token")
    }
  }

  async logout(refreshToken: string): Promise<void> {
    // Blacklist refresh token
    await this.redisService.set(`blacklist:${refreshToken}`, "true", 7 * 24 * 60 * 60)
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email)
    if (!user) {
      // Don't reveal if email exists
      return
    }

    const resetToken = uuidv4()
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store reset token in Redis
    await this.redisService.set(`reset:${resetToken}`, user.id, 15 * 60) // 15 minutes

    // TODO: Send email with reset token
    console.log(`Password reset token for ${user.email}: ${resetToken}`)
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto

    const userId = await this.redisService.get(`reset:${token}`)
    if (!userId) {
      throw new BadRequestException("Invalid or expired reset token")
    }

    const user = await this.usersService.findOne(userId)
    if (!user) {
      throw new BadRequestException("User not found")
    }

    // Update password
    await this.usersService.update(user.id, { password: newPassword })

    // Delete reset token
    await this.redisService.del(`reset:${token}`)
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const permissions = this.extractPermissions(user)

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      permissions,
    }

    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_REFRESH_SECRET") || this.configService.get("JWT_SECRET"),
      expiresIn: "30d",
    })

    return { accessToken, refreshToken }
  }

  private extractPermissions(user: User): string[] {
    const permissions: string[] = []

    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            permissions.push(`${permission.resource}.${permission.action}`)
          }
        }
      }
    }

    return [...new Set(permissions)] // Remove duplicates
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitizedUser } = user
    return sanitizedUser
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub)
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive")
    }
    return user
  }
}
