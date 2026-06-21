import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AdminPrincipal, RequestWithAdmin } from '../common/admin.types';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {
  override handleRequest<T extends AdminPrincipal>(
    err: Error | null,
    user: T | false,
    _info: unknown,
    context: ExecutionContext,
  ): T {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Admin authentication required');
    }
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    request.admin = user;
    return user;
  }
}
