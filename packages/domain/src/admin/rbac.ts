export type AdminRole = 'support' | 'compliance' | 'finance' | 'administrator' | 'auditor';

export type AdminPermission =
  | 'transfer:mutate'
  | 'refund:propose'
  | 'refund:approve'
  | 'compliance:decide'
  | 'flags:manage'
  | 'reconciliation:view'
  | 'audit:export';

const ALL_PERMISSIONS: readonly AdminPermission[] = [
  'transfer:mutate',
  'refund:propose',
  'refund:approve',
  'compliance:decide',
  'flags:manage',
  'reconciliation:view',
  'audit:export',
];

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  support: [],
  compliance: ['compliance:decide'],
  finance: ['refund:propose', 'refund:approve', 'reconciliation:view'],
  administrator: ALL_PERMISSIONS,
  auditor: ['audit:export'],
};

export function hasPermission(roles: AdminRole[], permission: AdminPermission): boolean {
  if (roles.includes('administrator')) {
    return true;
  }

  return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function isReadOnlyRole(roles: AdminRole[]): boolean {
  return roles.includes('auditor') && !roles.includes('administrator');
}

export function canMutate(roles: AdminRole[]): boolean {
  return hasPermission(roles, 'transfer:mutate');
}
