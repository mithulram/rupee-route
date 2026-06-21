import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { apiEnvSchema, parseEnv } from '@rupeeroute/config';

export interface JwtPayload {
  sub: string;
  email: string;
  countryCode: 'DE' | 'CH';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const env = parseEnv(apiEnvSchema);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      countryCode: payload.countryCode,
    };
  }
}
