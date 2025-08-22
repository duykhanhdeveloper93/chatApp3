import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm"
import { Role } from "./role.entity"

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  description: string

  @Column()
  resource: string

  @Column()
  action: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToMany(
    () => Role,
    (role) => role.permissions,
  )
  roles: Role[]
}
