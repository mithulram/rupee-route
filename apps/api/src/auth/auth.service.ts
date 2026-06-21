import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { buildAuditEvent, PrismaClient, type Prisma } from '@rupeeroute/domain';
import { createLogger } from '@rupeeroute/observability';
import * as bcrypt from 'bcryptjs';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = createLogger({ service: 'api-auth' });

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        countryCode: dto.countryCode,
      },
    });

    await this.prisma.auditEvent.create({
      data: buildAuditEvent({
        eventType: 'user.registered',
        actorType: 'user',
        actorId: user.id,
        resourceType: 'user',
        resourceId: user.id,
        correlationId: user.id,
        payload: { countryCode: user.countryCode },
        userId: user.id,
      }) as Prisma.AuditEventCreateInput,
    });

    this.logger.info({ userId: user.id, countryCode: user.countryCode }, 'User registered');

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.auditEvent.create({
      data: buildAuditEvent({
        eventType: 'user.logged_in',
        actorType: 'user',
        actorId: user.id,
        resourceType: 'user',
        resourceId: user.id,
        correlationId: user.id,
        payload: {},
        userId: user.id,
      }) as Prisma.AuditEventCreateInput,
    });

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    countryCode: string;
    preferredLanguage?: string;
    notificationEmail?: boolean;
    kycStatus?: string;
  }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      countryCode: user.countryCode,
    });

    return {
      accessToken,
      tokenType: 'Bearer' as const,
      user: {
        id: user.id,
        email: user.email,
        countryCode: user.countryCode as 'DE' | 'CH',
        preferredLanguage: (user.preferredLanguage ?? 'en') as 'en' | 'de',
        notificationEmail: user.notificationEmail ?? true,
        kycStatus: user.kycStatus ?? 'pending',
      },
    };
  }
}
