import { describe, expect, it } from 'vitest';
import {
  hasPermission,
  isReadOnlyRole,
  ROLE_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from './rbac.js';

const ROLES: AdminRole[] = ['support', 'compliance', 'finance', 'administrator', 'auditor'];

describe('admin RBAC permission matrix', () => {
  it('defines explicit permissions for every role', () => {
    for (const role of ROLES) {
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  describe('support', () => {
    const roles: AdminRole[] = ['support'];

    it('cannot mutate transfer state', () => {
      expect(hasPermission(roles, 'transfer:mutate')).toBe(false);
    });

    it('cannot approve refunds or manage flags', () => {
      expect(hasPermission(roles, 'refund:approve')).toBe(false);
      expect(hasPermission(roles, 'flags:manage')).toBe(false);
    });
  });

  describe('compliance', () => {
    const roles: AdminRole[] = ['compliance'];

    it('can approve or decline compliance reviews', () => {
      expect(hasPermission(roles, 'compliance:decide')).toBe(true);
    });

    it('cannot manage feature flags', () => {
      expect(hasPermission(roles, 'flags:manage')).toBe(false);
    });
  });

  describe('finance', () => {
    const roles: AdminRole[] = ['finance'];

    it('can propose and approve refunds', () => {
      expect(hasPermission(roles, 'refund:propose')).toBe(true);
      expect(hasPermission(roles, 'refund:approve')).toBe(true);
    });

    it('can view reconciliation data', () => {
      expect(hasPermission(roles, 'reconciliation:view')).toBe(true);
    });
  });

  describe('administrator', () => {
    const roles: AdminRole[] = ['administrator'];

    it('can manage feature flags and all operational permissions', () => {
      const permissions: AdminPermission[] = [
        'transfer:mutate',
        'refund:propose',
        'refund:approve',
        'compliance:decide',
        'flags:manage',
        'reconciliation:view',
        'audit:export',
      ];

      for (const permission of permissions) {
        expect(hasPermission(roles, permission)).toBe(true);
      }
    });
  });

  describe('auditor', () => {
    const roles: AdminRole[] = ['auditor'];

    it('can export audit events', () => {
      expect(hasPermission(roles, 'audit:export')).toBe(true);
    });

    it('cannot mutate transfers, refunds, or flags', () => {
      expect(hasPermission(roles, 'transfer:mutate')).toBe(false);
      expect(hasPermission(roles, 'refund:approve')).toBe(false);
      expect(hasPermission(roles, 'flags:manage')).toBe(false);
    });

    it('is treated as read-only', () => {
      expect(isReadOnlyRole(roles)).toBe(true);
    });
  });
});
