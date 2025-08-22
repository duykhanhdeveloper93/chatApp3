import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { Message } from "./message.entity"

@Entity("message_attachments")
export class MessageAttachment {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  filename: string

  @Column()
  originalName: string

  @Column()
  mimeType: string

  @Column()
  size: number

  @Column()
  url: string

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(
    () => Message,
    (message) => message.attachments,
  )
  @JoinColumn({ name: "messageId" })
  message: Message

  @Column()
  messageId: string
}
