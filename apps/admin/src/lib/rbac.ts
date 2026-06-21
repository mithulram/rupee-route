import type { AdminRole } from './types';

export interface NavItem {
  href: string;
  label: string;
  roles: AdminRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Overview',
    roles: ['support', 'compliance', 'finance', 'administrator', 'auditor'],
  },
  { href: '/transfers', label: 'Transfers', roles: ['support', 'administrator', 'auditor'] },
  { href: '/tickets', label: 'Tickets', roles: ['support', 'administrator'] },
  {
    href: '/compliance/reviews',
    label: 'Compliance reviews',
    roles: ['compliance', 'administrator'],
  },
  {
    href: '/privacy-requests',
    label: 'Privacy requests',
    roles: ['compliance', 'administrator'],
  },
  { href: '/reconciliation', label: 'Reconciliation', roles: ['finance', 'administrator'] },
  {
    href: '/refund-proposals',
    label: 'Refund proposals',
    roles: ['finance', 'administrator'],
  },
  {
    href: '/webhook-failures',
    label: 'Webhook failures',
    roles: ['finance', 'administrator'],
  },
  { href: '/audit', label: 'Audit events', roles: ['administrator', 'auditor'] },
  { href: '/feature-flags', label: 'Feature flags', roles: ['administrator'] },
  { href: '/providers', label: 'Providers', roles: ['administrator'] },
];

export function hasAnyRole(userRoles: AdminRole[], allowed: AdminRole[]): boolean {
  if (userRoles.includes('administrator')) return true;
  return allowed.some((role) => userRoles.includes(role));
}

export function filterNavByRoles(roles: AdminRole[]): NavItem[] {
  if (roles.includes('administrator')) return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => item.roles.some((role) => roles.includes(role)));
}

export function canWriteTickets(roles: AdminRole[]): boolean {
  return hasAnyRole(roles, ['support']);
}

export function canDecideCompliance(roles: AdminRole[]): boolean {
  return hasAnyRole(roles, ['compliance']);
}

export function canManageFinance(roles: AdminRole[]): boolean {
  return hasAnyRole(roles, ['finance']);
}

export function canEditFeatureFlags(roles: AdminRole[]): boolean {
  return roles.includes('administrator');
}

export function canExportAudit(roles: AdminRole[]): boolean {
  return roles.includes('auditor') || roles.includes('administrator');
}

export function isReadOnly(roles: AdminRole[]): boolean {
  return roles.includes('auditor') && !roles.includes('administrator');
}
