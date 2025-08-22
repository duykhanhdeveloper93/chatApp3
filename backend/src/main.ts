import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppModule } from "./app.module"
import { IoAdapter } from "@nestjs/platform-socket.io"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Enable CORS
  app.enableCors({
    origin: configService.get("FRONTEND_URL") || "http://localhost:4200",
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app))

  // Global prefix
  app.setGlobalPrefix("api")

  const port = configService.get("PORT") || 3000
  await app.listen(port)

  console.log(`Application is running on: http://localhost:${port}`)
}
bootstrap()
