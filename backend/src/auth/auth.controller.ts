import { Controller, Post, UseGuards, HttpCode, HttpStatus } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"

import type { AuthService } from "./auth.service"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import type { RegisterDto } from "./dto/register.dto"
import type { LoginDto } from "./dto/login.dto"
import type { RefreshTokenDto } from "./dto/refresh-token.dto"
import type { ForgotPasswordDto } from "./dto/forgot-password.dto"
import type { ResetPasswordDto } from "./dto/reset-password.dto"

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async register(registerDto: RegisterDto) {
    return await this.authService.register(registerDto)
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async login(loginDto: LoginDto) {
    return await this.authService.login(loginDto)
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto)
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken)
  }

  @Post("forgot-password")
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto)
  }

  @Post("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(req) {
    return req.user
  }
}
