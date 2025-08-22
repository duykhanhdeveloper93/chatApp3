import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { MulterModule } from "@nestjs/platform-express"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { diskStorage } from "multer"
import { extname, join } from "path"
import { v4 as uuidv4 } from "uuid"

import { FilesController } from "./files.controller"
import { FilesService } from "./files.service"
import { MessageAttachment } from "../database/entities/message-attachment.entity"

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageAttachment]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = configService.get("UPLOAD_PATH") || "./uploads"
            const subDir = file.mimetype.startsWith("image/") ? "images" : "files"
            cb(null, join(uploadPath, subDir))
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`
            cb(null, uniqueSuffix)
          },
        }),
        limits: {
          fileSize: configService.get("MAX_FILE_SIZE") || 10 * 1024 * 1024, // 10MB
          files: 5, // Max 5 files per request
        },
        fileFilter: (req, file, cb) => {
          // Allow images, documents, and some media files
          const allowedMimes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "audio/mpeg",
            "audio/wav",
            "video/mp4",
            "video/webm",
          ]

          if (allowedMimes.includes(file.mimetype)) {
            cb(null, true)
          } else {
            cb(new Error("File type not allowed"), false)
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
