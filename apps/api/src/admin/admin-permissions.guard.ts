import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission, type AdminPermission } from '@rupeeroute/domain';
import type { RequestWithAdmin } from '../common/admin.types';
import { PERMISSIONS_KEY } from './admin-permissions.decorator';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const principal = request.admin ?? request.user;
    const roles = principal?.roles ?? [];

    const allowed = requiredPermissions.every((permission) => hasPermission(roles, permission));

    if (!allowed) {
      throw new ForbiddenException('Insufficient admin permissions');
    }

    return true;
  }
}
