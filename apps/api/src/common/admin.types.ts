export type AdminRole = 'support' | 'compliance' | 'finance' | 'administrator' | 'auditor';

export interface AdminPrincipal {
  id: string;
  email: string;
  roles: AdminRole[];
}

export interface RequestWithAdmin {
  admin?: AdminPrincipal;
  user?: AdminPrincipal;
}
