import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { MenusController } from "./menus.controller"
import { MenusService } from "./menus.service"
import { Menu } from "../database/entities/menu.entity"
import { Role } from "../database/entities/role.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu, Role]),
  ],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
