import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { JwtModule } from "@nestjs/jwt"
import { ConfigModule, ConfigService } from "@nestjs/config"

import { ChatController } from "./chat.controller"
import { MessagesController } from "./messages.controller"
import { ChatService } from "./chat.service"
import { MessagesService } from "./messages.service"
import { ChatGateway } from "./chat.gateway"
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard"

import { ChatRoom } from "../database/entities/chat-room.entity"
import { Message } from "../database/entities/message.entity"
import { MessageAttachment } from "../database/entities/message-attachment.entity"
import { User } from "../database/entities/user.entity"
import { CommonModule } from '../common/common.module'
import { FilesModule } from "@/files/files.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, MessageAttachment, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN") || "15m",
        },
      }),
      inject: [ConfigService],
     
    }),
     CommonModule,
     FilesModule
  ],
  controllers: [ChatController, MessagesController],
  providers: [ChatService, MessagesService, ChatGateway, WsJwtGuard],
  exports: [ChatService, MessagesService, ChatGateway],
})
export class ChatModule {}
