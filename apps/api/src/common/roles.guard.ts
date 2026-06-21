import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole, RequestWithAdmin } from './admin.types';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const principal = request.admin ?? request.user;
    const roles = principal?.roles ?? [];

    if (!roles.some((role) => requiredRoles.includes(role))) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}
