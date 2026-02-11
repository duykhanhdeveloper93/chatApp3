import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { PermissionsController } from "./permissions.controller"
import { PermissionsService } from "./permissions.service"
import { Permission } from "../database/entities/permission.entity"
import { Role } from "@/database/entities/role.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Permission,Role])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
