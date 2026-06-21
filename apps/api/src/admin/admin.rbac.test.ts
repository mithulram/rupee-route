import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { AdminRole } from '../common/admin.types';
import { AdminPermissionsGuard } from './admin-permissions.guard';

function mockContext(roles: AdminRole[], permission: string) {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);

  const guard = new AdminPermissionsGuard(reflector);

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        admin: { id: 'admin_test', email: 'test@example.com', roles },
      }),
    }),
  } as never;

  return { guard, context };
}

describe('Admin RBAC authorization matrix', () => {
  describe('support', () => {
    it('cannot mutate transfer state', () => {
      const { guard, context } = mockContext(['support'], 'transfer:mutate');
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('cannot approve refunds or change flags', () => {
      const refund = mockContext(['support'], 'refund:approve');
      const flags = mockContext(['support'], 'flags:manage');

      expect(() => refund.guard.canActivate(refund.context)).toThrow(ForbiddenException);
      expect(() => flags.guard.canActivate(flags.context)).toThrow(ForbiddenException);
    });
  });

  describe('compliance', () => {
    it('can approve or decline compliance reviews', () => {
      const { guard, context } = mockContext(['compliance'], 'compliance:decide');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('cannot manage feature flags', () => {
      const { guard, context } = mockContext(['compliance'], 'flags:manage');
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('finance', () => {
    it('can propose and approve refunds', () => {
      const propose = mockContext(['finance'], 'refund:propose');
      const approve = mockContext(['finance'], 'refund:approve');

      expect(propose.guard.canActivate(propose.context)).toBe(true);
      expect(approve.guard.canActivate(approve.context)).toBe(true);
    });

    it('can view reconciliation endpoints', () => {
      const { guard, context } = mockContext(['finance'], 'reconciliation:view');
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('administrator', () => {
    it('can manage feature flags and operational mutations', () => {
      const flags = mockContext(['administrator'], 'flags:manage');
      const transfer = mockContext(['administrator'], 'transfer:mutate');

      expect(flags.guard.canActivate(flags.context)).toBe(true);
      expect(transfer.guard.canActivate(transfer.context)).toBe(true);
    });
  });

  describe('auditor', () => {
    it('can export audit events', () => {
      const { guard, context } = mockContext(['auditor'], 'audit:export');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('cannot mutate transfers, refunds, or flags', () => {
      const transfer = mockContext(['auditor'], 'transfer:mutate');
      const refund = mockContext(['auditor'], 'refund:approve');
      const flags = mockContext(['auditor'], 'flags:manage');

      expect(() => transfer.guard.canActivate(transfer.context)).toThrow(ForbiddenException);
      expect(() => refund.guard.canActivate(refund.context)).toThrow(ForbiddenException);
      expect(() => flags.guard.canActivate(flags.context)).toThrow(ForbiddenException);
    });
  });
});

describe('Admin RBAC service authorization (mocked)', () => {
  class MockAdminService {
    authorize(roles: AdminRole[], permission: string): boolean {
      const reflector = new Reflector();
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([permission]);
      const guard = new AdminPermissionsGuard(reflector);

      const context = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            admin: { id: 'svc', email: 'svc@example.com', roles },
          }),
        }),
      } as never;

      try {
        return guard.canActivate(context);
      } catch {
        return false;
      }
    }
  }

  const service = new MockAdminService();

  it('blocks support from refund approval via service layer', () => {
    expect(service.authorize(['support'], 'refund:approve')).toBe(false);
  });

  it('allows finance to propose refunds via service layer', () => {
    expect(service.authorize(['finance'], 'refund:propose')).toBe(true);
  });
});
