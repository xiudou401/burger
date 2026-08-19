export declare const MAX_CART_ITEMS = 50;
export declare const MAX_CART_ITEM_QUANTITY = 20;
export type UserRole = 'customer' | 'admin' | 'staff';
export declare const PERMISSIONS: readonly ["create_order", "view_own_orders", "view_orders", "manage_orders", "update_order_status", "manage_menu", "manage_staff", "manage_customers", "view_audit_logs"];
export type Permission = (typeof PERMISSIONS)[number];
export declare const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]>;
export declare const getPermissionsForRole: (role?: UserRole) => ("create_order" | "view_own_orders" | "view_orders" | "manage_orders" | "update_order_status" | "manage_menu" | "manage_staff" | "manage_customers" | "view_audit_logs")[];
export declare const hasPermission: (user: {
    role?: UserRole;
    permissions?: readonly Permission[];
} | null | undefined, permission: Permission) => boolean;
