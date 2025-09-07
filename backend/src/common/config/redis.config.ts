import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, type RedisClientType } from "redis"

@Injectable()
export class RedisService {
  private client: RedisClientType

  constructor(private configService: ConfigService) {
    this.client = createClient({
      socket: {
        host: this.configService.get("REDIS_HOST") || "localhost",
        port: this.configService.get("REDIS_PORT") || 6379,
      },
      password: this.configService.get("REDIS_PASSWORD") || undefined,
    })

    this.client.on("error", (err) => console.log("Redis Client Error", err))
    this.client.connect()
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }
}
