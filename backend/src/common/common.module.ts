import { Global, Module } from "@nestjs/common"
import { RedisService } from "./config/redis.config"
import { RabbitMQService } from "./config/rabbitmq.config"

@Global()
@Module({
  providers: [RedisService, RabbitMQService],
  exports: [RedisService, RabbitMQService],
})
export class CommonModule {}
