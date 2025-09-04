import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ConfigService } from "@nestjs/config"
import { ExtractJwt, Strategy } from "passport-jwt"

import { AuthService, JwtPayload } from "../auth.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    })
  }

  async validate(payload: JwtPayload) {
    console.log("vào đây jwtstrategy")
    const user = await this.authService.validateJwtPayload(payload)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
