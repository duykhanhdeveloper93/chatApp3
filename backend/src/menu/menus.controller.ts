import {
  Controller,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common"
import { MenusService } from "./menus.service"
import { AuthGuard } from "@nestjs/passport"

@Controller("menus")
@UseGuards(AuthGuard("jwt"))
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  /**
   * ✅ Lấy menu theo user đang login
   * GET /api/menus/me
   */
  @Get("me")
  async getMyMenus(@Req() req) {
    const user = req.user

    const roleCodes = user.roles?.map((r) => r.code) || []

    return this.menusService.findByRole(roleCodes)
  }

  /**
   * (Optional) Lấy toàn bộ menu (admin)
   * GET /api/menus
   */
  @Get()
  async findAll() {
    return this.menusService.findAll()
  }
}
