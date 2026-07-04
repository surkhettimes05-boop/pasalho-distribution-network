const ADMIN_ROLE_VALUES = ['admin', 'administrator', 'superadmin', 'super-admin', 'owner'];
const ADMIN_EMAILS = ['john@pasalho.com', 'ram@pasalho.com', 'admin@pasalho.com'];

export function normalizeRole(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function isAdminRep(rep: any | null | undefined): boolean {
  if (!rep) return false;

  const role = normalizeRole(rep.role);
  const email = normalizeRole(rep.email);

  return ADMIN_ROLE_VALUES.includes(role) || ADMIN_EMAILS.includes(email);
}
