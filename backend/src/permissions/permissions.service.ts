import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Permission } from "../database/entities/permission.entity";
import { Role } from "../database/entities/role.entity";

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /* =========================
   * CREATE
   * ========================= */
  async create(data: {
    name: string;
    description?: string;
    resource: string;
    action: string;
    roleIds?: string[];
  }): Promise<Permission> {
    const existed = await this.permissionRepository.findOne({
      where: { name: data.name },
    });

    if (existed) {
      throw new BadRequestException("Permission already exists");
    }

    const permission = this.permissionRepository.create({
      name: data.name,
      description: data.description,
      resource: data.resource,
      action: data.action,
    });

    if (data.roleIds?.length) {
      const roles = await this.roleRepository.find({
        where: { id: In(data.roleIds) },
      });
      permission.roles = roles;
    }

    return this.permissionRepository.save(permission);
  }

  /* =========================
   * FIND ALL
   * ========================= */
  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ["roles"],
      order: { createdAt: "DESC" },
    });
  }

  /* =========================
   * FIND ONE
   * ========================= */
  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ["roles"],
    });

    if (!permission) {
      throw new NotFoundException("Permission not found");
    }

    return permission;
  }

  /* =========================
   * UPDATE
   * ========================= */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      resource?: string;
      action?: string;
      roleIds?: string[];
    },
  ): Promise<Permission> {
    const permission = await this.findById(id);

    Object.assign(permission, {
      name: data.name ?? permission.name,
      description: data.description ?? permission.description,
      resource: data.resource ?? permission.resource,
      action: data.action ?? permission.action,
    });

    if (data.roleIds) {
      const roles = await this.roleRepository.find({
        where: { id: In(data.roleIds) },
      });
      permission.roles = roles;
    }

    return this.permissionRepository.save(permission);
  }

  /* =========================
   * DELETE
   * ========================= */
  async remove(id: string): Promise<void> {
    const permission = await this.findById(id);
    await this.permissionRepository.remove(permission);
  }

  /* =========================
   * ASSIGN ROLES
   * ========================= */
  async assignRoles(
    permissionId: string,
    roleIds: string[],
  ): Promise<Permission> {
    const permission = await this.findById(permissionId);

    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
    });

    if (!roles.length) {
      throw new BadRequestException("Roles not found");
    }

    permission.roles = roles;
    return this.permissionRepository.save(permission);
  }

  /* =========================
   * REMOVE ROLE FROM PERMISSION
   * ========================= */
  async removeRole(
    permissionId: string,
    roleId: string,
  ): Promise<Permission> {
    const permission = await this.findById(permissionId);

    permission.roles = permission.roles.filter(
      (role) => role.id !== roleId,
    );

    return this.permissionRepository.save(permission);
  }

  /* =========================
 * SEED DEFAULT PERMISSIONS
 * ========================= */
async seedDefaultPermissions(): Promise<{ message: string }> {
  const resources = ["users", "roles", "permissions"];
  const actions = ["create", "read", "update", "delete"];

  const createdPermissions: Permission[] = [];

  for (const resource of resources) {
    for (const action of actions) {
      const name = `${resource}:${action}`;

      const existed = await this.permissionRepository.findOne({
        where: { name },
      });

      if (!existed) {
        const permission = this.permissionRepository.create({
          name,
          description: `Allow ${action} on ${resource}`,
          resource,
          action,
        });

        const saved = await this.permissionRepository.save(permission);
        createdPermissions.push(saved);
      }
    }
  }

  // Nếu có role ADMIN thì auto gán full quyền
  const adminRole = await this.roleRepository.findOne({
    where: { name: "ADMIN" },
    relations: ["permissions"],
  });

  if (adminRole) {
    const allPermissions = await this.permissionRepository.find();
    adminRole.permissions = allPermissions;
    await this.roleRepository.save(adminRole);
  }

  return {
    message: `Seed completed. Created ${createdPermissions.length} new permissions.`,
  };
}

}
