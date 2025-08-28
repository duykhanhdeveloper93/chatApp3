import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import  { Repository } from "typeorm"
import  { User } from "../database/entities/user.entity"
import  { CreateUserDto } from "./dto/create-user.dto"
import  { UpdateUserDto } from "./dto/update-user.dto"
import * as bcrypt from "bcryptjs"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class UsersService {


  constructor(
     @InjectRepository(User)
    private readonly usersRepository: Repository<User>,) {
    this.usersRepository = usersRepository
  }

  getUsersRepository(): Repository<User> {
    return this.usersRepository
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    })

    if (existingUser) {
      throw new ConflictException("User with this email or username already exists")
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12)

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    })

    return await this.usersRepository.save(user)
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      relations: ["roles", "roles.permissions"],
      select: ["id", "email", "username", "avatar", "isActive", "lastSeen", "createdAt"],
    })
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["roles", "roles.permissions"],
      select: ["id", "email", "username", "avatar", "isActive", "lastSeen", "createdAt"],
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return user
  }

  async findByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ["roles", "roles.permissions"],
    })
  }

  async findByUsername(username: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { username },
      relations: ["roles", "roles.permissions"],
    })
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id)

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12)
    }

    Object.assign(user, updateUserDto)
    return await this.usersRepository.save(user)
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id)
    await this.usersRepository.remove(user)
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastSeen: new Date() })
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password)
  }
}
