import { Injectable, type CanActivate, type ExecutionContext, BadRequestException } from "@nestjs/common"

@Injectable()
export class FileTypeGuard implements CanActivate {
  constructor(private readonly allowedTypes: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const files = request.files || [request.file]

    if (files) {
      for (const file of files) {
        if (file && !this.allowedTypes.includes(file.mimetype)) {
          throw new BadRequestException(`File type ${file.mimetype} is not allowed`)
        }
      }
    }

    return true
  }
}
