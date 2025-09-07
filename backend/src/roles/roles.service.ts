import { Injectable, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { Role } from "../database/entities/role.entity"
import { Permission } from "../database/entities/permission.entity"
import type { CreateRoleDto } from "./dto/create-role.dto"
import type { UpdateRoleDto } from "./dto/update-role.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {
   
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.rolesRepository.create(createRoleDto)

    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      const permissions = await this.permissionsRepository.findByIds(createRoleDto.permissionIds)
      role.permissions = permissions
    }

    return await this.rolesRepository.save(role)
  }

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find({
      relations: ["permissions"],
    })
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ["permissions"],
    })

    if (!role) {
      throw new NotFoundException("Role not found")
    }

    return role
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id)

    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionsRepository.findByIds(updateRoleDto.permissionIds)
      role.permissions = permissions
    }

    Object.assign(role, updateRoleDto)
    return await this.rolesRepository.save(role)
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id)
    await this.rolesRepository.remove(role)
  }
}
