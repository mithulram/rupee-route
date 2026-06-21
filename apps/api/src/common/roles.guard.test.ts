import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('allows administrators for administrator-only routes', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['administrator']);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          admin: { id: 'admin_1', email: 'ops@example.com', roles: ['administrator'] },
        }),
      }),
    } as never;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects non-administrator roles', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['administrator']);

    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          admin: { id: 'admin_2', email: 'support@example.com', roles: ['support'] },
        }),
      }),
    } as never;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
