import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { RolesModule } from '../roles/roles.module'
import { PermissionsModule } from '../permissions/permissions.module'
import { SeedService } from './seed.service'

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
