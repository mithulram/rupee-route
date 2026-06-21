import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { apiEnvSchema, parseEnv } from '@rupeeroute/config';
import type { AdminRole } from '../common/admin.types';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  roles: AdminRole[];
  kind: 'admin';
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    const env = parseEnv(apiEnvSchema);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  validate(payload: AdminJwtPayload) {
    if ((payload as { kind?: string }).kind !== 'admin') {
      throw new UnauthorizedException('Admin token required');
    }
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
