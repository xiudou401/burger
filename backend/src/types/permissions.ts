export type UserRole = 'customer' | 'admin' | 'staff';

export const PERMISSIONS = [
  'create_order',
  'view_own_orders',
  'view_orders',
  'manage_orders',
  'update_order_status',
  'manage_menu',
  'manage_staff',
  'manage_customers',
  'view_audit_logs',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: ['create_order', 'view_own_orders'],
  staff: ['view_orders', 'update_order_status'],
  admin: [
    'view_orders',
    'manage_orders',
    'update_order_status',
    'manage_menu',
    'manage_staff',
    'manage_customers',
    'view_audit_logs',
  ],
};

export const getPermissionsForRole = (role: UserRole = 'customer') => [
  ...ROLE_PERMISSIONS[role],
];

export const hasPermission = (
  user:
    | {
        role?: UserRole;
        permissions?: readonly Permission[];
      }
    | null
    | undefined,
  permission: Permission,
) => {
  if (!user) return false;

  return (
    user.permissions ?? ROLE_PERMISSIONS[user.role ?? 'customer']
  ).includes(permission);
};
