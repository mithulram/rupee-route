import { SetMetadata } from '@nestjs/common';
import type { AdminPermission } from '@rupeeroute/domain';

export const PERMISSIONS_KEY = 'admin_permissions';

export const RequirePermission = (...permissions: AdminPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
