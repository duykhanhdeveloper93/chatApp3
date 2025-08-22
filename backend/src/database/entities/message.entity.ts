import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm"
import { User } from "./user.entity"
import { ChatRoom } from "./chat-room.entity"
import { MessageAttachment } from "./message-attachment.entity"

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  EMOJI = "emoji",
  STICKER = "sticker",
}

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("text")
  content: string

  @Column({
    type: "enum",
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType

  @Column({ default: false })
  isEdited: boolean

  @Column({ nullable: true })
  editedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(
    () => User,
    (user) => user.messages,
  )
  @JoinColumn({ name: "senderId" })
  sender: User

  @Column()
  senderId: string

  @ManyToOne(
    () => ChatRoom,
    (chatRoom) => chatRoom.messages,
  )
  @JoinColumn({ name: "chatRoomId" })
  chatRoom: ChatRoom

  @Column()
  chatRoomId: string

  @OneToMany(
    () => MessageAttachment,
    (attachment) => attachment.message,
  )
  attachments: MessageAttachment[]
}
