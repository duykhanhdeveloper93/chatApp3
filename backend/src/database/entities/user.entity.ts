import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm"
import { Exclude } from "class-transformer"
import { Role } from "./role.entity"
import { Message } from "./message.entity"
import { ChatRoom } from "./chat-room.entity"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  username: string

  @Column()
  @Exclude()
  password: string

  @Column({ nullable: true })
  avatar: string

  @Column({ default: true })
  isActive: boolean

  @Column({ nullable: true })
  lastSeen: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToMany(
    () => Role,
    (role) => role.users,
  )
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "userId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "roleId", referencedColumnName: "id" },
  })
  roles: Role[]

  @OneToMany(
    () => Message,
    (message) => message.sender,
  )
  messages: Message[]

  @ManyToMany(
    () => ChatRoom,
    (chatRoom) => chatRoom.participants,
  )
  chatRooms: ChatRoom[]
}
