import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { apiEnvSchema, parseEnv } from '@rupeeroute/config';
import { AdminAuthService } from './admin-auth.service';
import { AdminController } from './admin.controller';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.register({
      secret: parseEnv(apiEnvSchema).JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AdminController],
  providers: [
    AdminAuthService,
    AdminService,
    AdminJwtStrategy,
    AdminJwtAuthGuard,
    AdminPermissionsGuard,
    RolesGuard,
  ],
  exports: [AdminService],
})
export class AdminModule {}
