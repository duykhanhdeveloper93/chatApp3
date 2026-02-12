import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common"
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
    private readonly usersRepository: Repository<User>) 
    {
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
    console.log
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
      select: ["id", "email", "username", "avatar", "isActive", "lastSeen", "createdAt","isSystem"],
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return user
  }

  async findByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email }
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

    if (user.isSystem) {
      throw new BadRequestException("Không được phép xoá system user")
    }

    await this.usersRepository.remove(user)
  }

  

  async updateLastSeen(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastSeen: new Date() })
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password)
  }


  async findOrCreate(data: {
    email: string
    username: string
    password: string
    roles?: any[]
  }): Promise<User> {
    const exists = await this.usersRepository.findOne({
      where: { email: data.email },
      relations: ['roles'],
    })

    if (exists) return exists

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = this.usersRepository.create({
      email: data.email,
      username: data.username,
      password: hashedPassword,
      roles: data.roles || [],
    })

    return this.usersRepository.save(user)
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string
  ) {
    const skip = (page - 1) * limit

    const qb = this.usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "roles")
      .leftJoinAndSelect("roles.permissions", "permissions")
      .select([
        "user.id",
        "user.email",
        "user.username",
        "user.avatar",
        "user.isActive",
        "user.lastSeen",
        "user.createdAt",
        "roles.id",
        "roles.name",
        "permissions.id",
        "permissions.name",
      ])

    if (search) {
      qb.where("user.email LIKE :search OR user.username LIKE :search", {
        search: `%${search}%`,
      })
    }

    qb.skip(skip).take(limit).orderBy("user.createdAt", "DESC")

    const [data, total] = await qb.getManyAndCount()

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }


}
