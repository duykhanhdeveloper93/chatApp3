import { PartialType } from "@nestjs/mapped-types"
import { CreateRoleDto } from "./create-menu.dto"

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
