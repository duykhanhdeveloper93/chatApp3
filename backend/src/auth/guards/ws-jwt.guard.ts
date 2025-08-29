import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { WsException } from "@nestjs/websockets"

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient()
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(" ")[1]

      if (!token) {
        throw new WsException("No token provided")
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET"),
      })

      client.user = {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      }

      return true
    } catch (error) {
      throw new WsException("Invalid token")
    }
  }
}
