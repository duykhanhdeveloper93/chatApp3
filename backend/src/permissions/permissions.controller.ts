import { Controller, Get, Post, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from "@nestjs/common"
import { PermissionsService } from "./permissions.service"
import { CreatePermissionDto } from "./dto/create-permission.dto"
import { UpdatePermissionDto } from "./dto/update-permission.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { RequirePermissions } from "../auth/decorators/permissions.decorator"

@Controller("permissions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermissions("permissions", "create")
  create(createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto)
  }

  @Get()
  @RequirePermissions("permissions", "read")
  findAll() {
    return this.permissionsService.findAll()
  }

  @Get(":id")
  @RequirePermissions("permissions", "read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionsService.findOne(id)
  }

  @Patch(":id")
  @RequirePermissions("permissions", "update")
  update(@Param("id", ParseUUIDPipe) id: string, updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto)
  }

  @Delete(":id")
  @RequirePermissions("permissions", "delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionsService.remove(id)
  }

  @Post("seed")
  @RequirePermissions("permissions", "create")
  seedDefaultPermissions() {
    return this.permissionsService.seedDefaultPermissions()
  }
}
