import { Injectable, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import * as amqp from "amqplib"

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection
  private channel: amqp.Channel

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(this.configService.get("RABBITMQ_URL") || "amqp://localhost:5672")
      this.channel = await this.connection.createChannel()

      // Declare exchanges and queues
      await this.channel.assertExchange("chat.events", "topic", { durable: true })
      await this.channel.assertQueue("message.notifications", { durable: true })
      await this.channel.assertQueue("user.status", { durable: true })

      console.log("RabbitMQ connected successfully")
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error)
    }
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close()
    if (this.connection) await this.connection.close()
  }

  async publishMessage(exchange: string, routingKey: string, message: any) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized")
    }

    const messageBuffer = Buffer.from(JSON.stringify(message))
    return this.channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
    })
  }

  async consumeMessages(queue: string, callback: (message: any) => void) {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized")
    }

    await this.channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString())
        callback(content)
        this.channel.ack(msg)
      }
    })
  }
}
