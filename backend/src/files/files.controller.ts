import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
  ParseUUIDPipe,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common"
import { FilesInterceptor, FileInterceptor } from "@nestjs/platform-express"
import type { Express } from "express"

import type { FilesService } from "./files.service"
import type { UploadFileDto } from "./dto/upload-file.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { RequirePermissions } from "../auth/decorators/permissions.decorator"

@Controller("files")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @RequirePermissions("chat", "create")
  @UseInterceptors(FilesInterceptor("files", 5)) // Max 5 files
  async uploadFiles(files: Express.Multer.File[], uploadFileDto: UploadFileDto) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided")
    }

    return await this.filesService.uploadFiles(files, uploadFileDto)
  }

  @Post("upload/single")
  @RequirePermissions("chat", "create")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSingleFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file provided")
    }

    const result = await this.filesService.uploadFiles([file])
    return result[0]
  }

  @Post("upload/emoji")
  @RequirePermissions("chat", "create")
  @UseInterceptors(FileInterceptor("emoji"))
  async uploadEmoji(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No emoji file provided")
    }

    return await this.filesService.uploadEmoji(file)
  }

  @Post("upload/sticker")
  @RequirePermissions("chat", "create")
  @UseInterceptors(FileInterceptor("sticker"))
  async uploadSticker(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No sticker file provided")
    }

    return await this.filesService.uploadSticker(file)
  }

  @Get(":id")
  @RequirePermissions("chat", "read")
  async getFile(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    // Validate user has access to this file
    const hasAccess = await this.filesService.validateFileAccess(id, req.user.id)
    if (!hasAccess) {
      throw new ForbiddenException("You don't have access to this file")
    }

    return await this.filesService.getFile(id)
  }

  @Delete(":id")
  @RequirePermissions("chat", "delete")
  async deleteFile(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    // Validate user has access to this file
    const hasAccess = await this.filesService.validateFileAccess(id, req.user.id)
    if (!hasAccess) {
      throw new ForbiddenException("You don't have access to this file")
    }

    await this.filesService.deleteFile(id)
    return { message: "File deleted successfully" }
  }
}
