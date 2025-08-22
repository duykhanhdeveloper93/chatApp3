import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator"

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<{ resource: string; action: string }[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredPermissions) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()
    if (!user) {
      throw new ForbiddenException("User not authenticated")
    }

    const userPermissions = this.extractUserPermissions(user)

    const hasPermission = requiredPermissions.every((permission) => {
      const permissionString = `${permission.resource}.${permission.action}`
      return userPermissions.includes(permissionString)
    })

    if (!hasPermission) {
      throw new ForbiddenException("Insufficient permissions")
    }

    return true
  }

  private extractUserPermissions(user: any): string[] {
    const permissions: string[] = []

    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            permissions.push(`${permission.resource}.${permission.action}`)
          }
        }
      }
    }

    return [...new Set(permissions)]
  }
}
