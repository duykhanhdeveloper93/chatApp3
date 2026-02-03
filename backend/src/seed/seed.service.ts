// src/seed/seed.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { UsersService } from '../users/users.service'

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name)

  constructor(private readonly usersService: UsersService) {}

  async seedAdmin() {
    const adminEmail = 'admin@system.local'

    const exists = await this.usersService.findByEmail(adminEmail)
    if (exists) {
      this.logger.log('Admin user already exists')
      return
    }

    await this.usersService.create({
      email: adminEmail,
      username: 'admin',
      password: 'Thitcho123@',
      avatar: null,
    })

    this.logger.log('Admin user created successfully')
  }
}
