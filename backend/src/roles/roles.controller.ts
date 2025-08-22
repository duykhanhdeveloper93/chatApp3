import { Controller, Get, Post, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from "@nestjs/common"
import type { RolesService } from "./roles.service"
import type { CreateRoleDto } from "./dto/create-role.dto"
import type { UpdateRoleDto } from "./dto/update-role.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { RequirePermissions } from "../auth/decorators/permissions.decorator"

@Controller("roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions("roles", "create")
  create(createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto)
  }

  @Get()
  @RequirePermissions("roles", "read")
  findAll() {
    return this.rolesService.findAll()
  }

  @Get(":id")
  @RequirePermissions("roles", "read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id)
  }

  @Patch(":id")
  @RequirePermissions("roles", "update")
  update(@Param("id", ParseUUIDPipe) id: string, updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto)
  }

  @Delete(":id")
  @RequirePermissions("roles", "delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id)
  }
}
