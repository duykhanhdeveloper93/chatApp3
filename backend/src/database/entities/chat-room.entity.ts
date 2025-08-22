import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { User } from "./user.entity"
import { Message } from "./message.entity"

export enum ChatRoomType {
  DIRECT = "direct",
  GROUP = "group",
}

@Entity("chat_rooms")
export class ChatRoom {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ nullable: true })
  name: string

  @Column({
    type: "enum",
    enum: ChatRoomType,
    default: ChatRoomType.DIRECT,
  })
  type: ChatRoomType

  @Column({ nullable: true })
  avatar: string

  @Column({ nullable: true })
  description: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdBy" })
  creator: User

  @Column()
  createdBy: string

  @ManyToMany(
    () => User,
    (user) => user.chatRooms,
  )
  @JoinTable({
    name: "chat_room_participants",
    joinColumn: { name: "chatRoomId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "userId", referencedColumnName: "id" },
  })
  participants: User[]

  @OneToMany(
    () => Message,
    (message) => message.chatRoom,
  )
  messages: Message[]
}
