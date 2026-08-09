const MAX_CART_ITEMS = 50;
const MAX_CART_ITEM_QUANTITY = 20;

const PERMISSIONS = [
  'create_order',
  'view_own_orders',
  'view_orders',
  'manage_orders',
  'update_order_status',
  'manage_menu',
  'manage_staff',
  'manage_customers',
  'view_audit_logs',
];

const ROLE_PERMISSIONS = {
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

const getPermissionsForRole = (role = 'customer') => [
  ...ROLE_PERMISSIONS[role],
];

const hasPermission = (user, permission) => {
  if (!user) return false;

  return (
    user.permissions ?? ROLE_PERMISSIONS[user.role ?? 'customer']
  ).includes(permission);
};

module.exports = {
  MAX_CART_ITEMS,
  MAX_CART_ITEM_QUANTITY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
};
