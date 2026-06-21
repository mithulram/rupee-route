import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { buildAuditEvent, PrismaClient, type Prisma, type AdminRole } from '@rupeeroute/domain';
import { enrichAdminAuditPayload } from '@rupeeroute/observability';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin?.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = admin.roles as AdminRole[];

    await this.prisma.auditEvent.create({
      data: buildAuditEvent({
        eventType: 'admin.logged_in',
        actorType: 'admin',
        actorId: admin.id,
        resourceType: 'admin_user',
        resourceId: admin.id,
        correlationId: admin.id,
        payload: {
          ...enrichAdminAuditPayload(admin.email, roles, ip ?? 'unknown', 'login'),
        },
      }) as Prisma.AuditEventCreateInput,
    });

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      roles,
      kind: 'admin',
    });

    return {
      accessToken,
      admin: { id: admin.id, email: admin.email, roles },
    };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin?.active) {
      throw new UnauthorizedException('Admin not found');
    }
    return {
      id: admin.id,
      email: admin.email,
      roles: admin.roles as AdminRole[],
    };
  }
}
