"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.getPermissionsForRole = exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.MAX_CART_ITEM_QUANTITY = exports.MAX_CART_ITEMS = void 0;
exports.MAX_CART_ITEMS = 50;
exports.MAX_CART_ITEM_QUANTITY = 20;
exports.PERMISSIONS = [
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
exports.ROLE_PERMISSIONS = {
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
const getRolePermissions = (role = 'customer') => exports.ROLE_PERMISSIONS[role] ?? exports.ROLE_PERMISSIONS.customer;
const getPermissionsForRole = (role = 'customer') => [
    ...getRolePermissions(role),
];
exports.getPermissionsForRole = getPermissionsForRole;
const hasPermission = (user, permission) => {
    if (!user)
        return false;
    return (user.permissions ?? getRolePermissions(user.role)).includes(permission);
};
exports.hasPermission = hasPermission;
