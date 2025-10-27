import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ThrottlerModule } from "@nestjs/throttler"
import { ServeStaticModule } from "@nestjs/serve-static"
import { join } from "path"

import { CommonModule } from "./common/common.module"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { ChatModule } from "./chat/chat.module"
import { FilesModule } from "./files/files.module"
import { RolesModule } from "./roles/roles.module"
import { PermissionsModule } from "./permissions/permissions.module"

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("DB_HOST") || "localhost",
        port: configService.get("DB_PORT") || 3306,
        username: configService.get("DB_USERNAME") || "root",
        password: configService.get("DB_PASSWORD") || "",
        database: configService.get("DB_NAME") || "chat_app",
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
         synchronize: false, // ❌ tắt sync
        migrationsRun: true, // ✅ tự chạy migration khi app start
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'], // ✅ trỏ tới thư mục migration
        logging: configService.get('NODE_ENV') === 'development'
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),

    // Common module with Redis and RabbitMQ
    CommonModule,
    // Feature modules
    AuthModule,
    UsersModule,
    ChatModule,
    FilesModule,
    RolesModule,
    PermissionsModule,
  ],
})
export class AppModule {}
