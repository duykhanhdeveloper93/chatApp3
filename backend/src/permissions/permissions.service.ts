import { Injectable, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import { Permission } from "../database/entities/permission.entity"
import type { CreatePermissionDto } from "./dto/create-permission.dto"
import type { UpdatePermissionDto } from "./dto/update-permission.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionsRepository.create(createPermissionDto)
    return await this.permissionsRepository.save(permission)
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionsRepository.find()
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
    })

    if (!permission) {
      throw new NotFoundException("Permission not found")
    }

    return permission
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id)
    Object.assign(permission, updatePermissionDto)
    return await this.permissionsRepository.save(permission)
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id)
    await this.permissionsRepository.remove(permission)
  }

  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      { name: "users.create", resource: "users", action: "create", description: "Create users" },
      { name: "users.read", resource: "users", action: "read", description: "Read users" },
      { name: "users.update", resource: "users", action: "update", description: "Update users" },
      { name: "users.delete", resource: "users", action: "delete", description: "Delete users" },
      { name: "roles.create", resource: "roles", action: "create", description: "Create roles" },
      { name: "roles.read", resource: "roles", action: "read", description: "Read roles" },
      { name: "roles.update", resource: "roles", action: "update", description: "Update roles" },
      { name: "roles.delete", resource: "roles", action: "delete", description: "Delete roles" },
      { name: "chat.create", resource: "chat", action: "create", description: "Create chat rooms" },
      { name: "chat.read", resource: "chat", action: "read", description: "Read chat messages" },
      { name: "chat.update", resource: "chat", action: "update", description: "Update chat messages" },
      { name: "chat.delete", resource: "chat", action: "delete", description: "Delete chat messages" },
    ]

    for (const permData of defaultPermissions) {
      const existing = await this.permissionsRepository.findOne({
        where: { name: permData.name },
      })

      if (!existing) {
        const permission = this.permissionsRepository.create(permData)
        await this.permissionsRepository.save(permission)
      }
    }
  }
}
