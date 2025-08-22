import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { Repository } from "typeorm"
import { promises as fs } from "fs"
import { join } from "path"
import * as sharp from "sharp"
import type { Express } from "express"

import type { MessageAttachment } from "../database/entities/message-attachment.entity"
import type { UploadFileDto } from "./dto/upload-file.dto"

export interface FileUploadResult {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
}

@Injectable()
export class FilesService {
  constructor(
    private messageAttachmentRepository: Repository<MessageAttachment>,
    private configService: ConfigService,
  ) {}

  async uploadFiles(files: Express.Multer.File[], uploadFileDto?: UploadFileDto): Promise<FileUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided")
    }

    const results: FileUploadResult[] = []

    for (const file of files) {
      try {
        // Generate thumbnail for images
        let thumbnailUrl: string | undefined

        if (file.mimetype.startsWith("image/")) {
          thumbnailUrl = await this.generateThumbnail(file)
        }

        // Create file record
        const attachment = this.messageAttachmentRepository.create({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: this.getFileUrl(file),
        })

        const savedAttachment = await this.messageAttachmentRepository.save(attachment)

        results.push({
          id: savedAttachment.id,
          filename: savedAttachment.filename,
          originalName: savedAttachment.originalName,
          mimeType: savedAttachment.mimeType,
          size: savedAttachment.size,
          url: savedAttachment.url,
          thumbnailUrl,
        })
      } catch (error) {
        // Clean up file if database save fails
        await this.deletePhysicalFile(file.path)
        throw new BadRequestException(`Failed to process file ${file.originalname}: ${error.message}`)
      }
    }

    return results
  }

  async getFile(id: string): Promise<MessageAttachment> {
    const file = await this.messageAttachmentRepository.findOne({
      where: { id },
    })

    if (!file) {
      throw new NotFoundException("File not found")
    }

    return file
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.getFile(id)

    // Delete physical file
    const uploadPath = this.configService.get("UPLOAD_PATH") || "./uploads"
    const subDir = file.mimeType.startsWith("image/") ? "images" : "files"
    const filePath = join(uploadPath, subDir, file.filename)

    await this.deletePhysicalFile(filePath)

    // Delete thumbnail if exists
    if (file.mimeType.startsWith("image/")) {
      const thumbnailPath = join(uploadPath, "thumbnails", `thumb_${file.filename}`)
      await this.deletePhysicalFile(thumbnailPath)
    }

    // Delete database record
    await this.messageAttachmentRepository.remove(file)
  }

  async uploadEmoji(file: Express.Multer.File): Promise<FileUploadResult> {
    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Emoji must be an image file")
    }

    // Resize emoji to standard size (64x64)
    const uploadPath = this.configService.get("UPLOAD_PATH") || "./uploads"
    const emojiDir = join(uploadPath, "emojis")
    const resizedFilename = `emoji_${file.filename}`
    const resizedPath = join(emojiDir, resizedFilename)

    try {
      // Ensure emoji directory exists
      await fs.mkdir(emojiDir, { recursive: true })

      // Resize image
      await sharp(file.path)
        .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(resizedPath)

      // Delete original file
      await this.deletePhysicalFile(file.path)

      // Create file record
      const attachment = this.messageAttachmentRepository.create({
        filename: resizedFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: (await fs.stat(resizedPath)).size,
        url: `/uploads/emojis/${resizedFilename}`,
      })

      const savedAttachment = await this.messageAttachmentRepository.save(attachment)

      return {
        id: savedAttachment.id,
        filename: savedAttachment.filename,
        originalName: savedAttachment.originalName,
        mimeType: savedAttachment.mimeType,
        size: savedAttachment.size,
        url: savedAttachment.url,
      }
    } catch (error) {
      // Clean up files on error
      await this.deletePhysicalFile(file.path)
      await this.deletePhysicalFile(resizedPath)
      throw new BadRequestException(`Failed to process emoji: ${error.message}`)
    }
  }

  async uploadSticker(file: Express.Multer.File): Promise<FileUploadResult> {
    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Sticker must be an image file")
    }

    // Resize sticker to standard size (128x128)
    const uploadPath = this.configService.get("UPLOAD_PATH") || "./uploads"
    const stickerDir = join(uploadPath, "stickers")
    const resizedFilename = `sticker_${file.filename}`
    const resizedPath = join(stickerDir, resizedFilename)

    try {
      // Ensure sticker directory exists
      await fs.mkdir(stickerDir, { recursive: true })

      // Resize image
      await sharp(file.path)
        .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(resizedPath)

      // Delete original file
      await this.deletePhysicalFile(file.path)

      // Create file record
      const attachment = this.messageAttachmentRepository.create({
        filename: resizedFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: (await fs.stat(resizedPath)).size,
        url: `/uploads/stickers/${resizedFilename}`,
      })

      const savedAttachment = await this.messageAttachmentRepository.save(attachment)

      return {
        id: savedAttachment.id,
        filename: savedAttachment.filename,
        originalName: savedAttachment.originalName,
        mimeType: savedAttachment.mimeType,
        size: savedAttachment.size,
        url: savedAttachment.url,
      }
    } catch (error) {
      // Clean up files on error
      await this.deletePhysicalFile(file.path)
      await this.deletePhysicalFile(resizedPath)
      throw new BadRequestException(`Failed to process sticker: ${error.message}`)
    }
  }

  private async generateThumbnail(file: Express.Multer.File): Promise<string> {
    const uploadPath = this.configService.get("UPLOAD_PATH") || "./uploads"
    const thumbnailDir = join(uploadPath, "thumbnails")
    const thumbnailFilename = `thumb_${file.filename}`
    const thumbnailPath = join(thumbnailDir, thumbnailFilename)

    try {
      // Ensure thumbnail directory exists
      await fs.mkdir(thumbnailDir, { recursive: true })

      // Generate thumbnail (300x300 max, maintain aspect ratio)
      await sharp(file.path)
        .resize(300, 300, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath)

      return `/uploads/thumbnails/${thumbnailFilename}`
    } catch (error) {
      console.error("Failed to generate thumbnail:", error)
      return undefined
    }
  }

  private getFileUrl(file: Express.Multer.File): string {
    const subDir = file.mimetype.startsWith("image/") ? "images" : "files"
    return `/uploads/${subDir}/${file.filename}`
  }

  private async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist, ignore error
      console.warn(`Failed to delete file ${filePath}:`, error.message)
    }
  }

  async getFilesByIds(ids: string[]): Promise<MessageAttachment[]> {
    return await this.messageAttachmentRepository.findByIds(ids)
  }

  async validateFileAccess(fileId: string, userId: string): Promise<boolean> {
    // Check if user has access to the file through message ownership or chat room participation
    const file = await this.messageAttachmentRepository.findOne({
      where: { id: fileId },
      relations: ["message", "message.chatRoom", "message.chatRoom.participants"],
    })

    if (!file || !file.message) {
      return false
    }

    // Check if user is the sender or a participant in the chat room
    const isParticipant = file.message.chatRoom.participants.some((participant) => participant.id === userId)
    const isSender = file.message.senderId === userId

    return isParticipant || isSender
  }
}
