import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  BadRequestException,
} from "@nestjs/common"
import type { Observable } from "rxjs"

@Injectable()
export class FileSizeInterceptor implements NestInterceptor {
  constructor(private readonly maxSize: number) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const files = request.files || [request.file]

    if (files) {
      for (const file of files) {
        if (file && file.size > this.maxSize) {
          throw new BadRequestException(`File ${file.originalname} exceeds maximum size of ${this.maxSize} bytes`)
        }
      }
    }

    return next.handle()
  }
}
