import { JwtPayload } from "../auth/auth.service"

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload & { id?: string }
  }
}