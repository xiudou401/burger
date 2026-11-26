import { getPermissionsForRole, hasPermission } from './permissions';

describe('permissions', () => {
  test('defaults to customer permissions and returns independent copies', () => {
    const permissions = getPermissionsForRole();
    expect(permissions).toEqual(['create_order', 'view_own_orders']);
    permissions.push('manage_menu');
    expect(getPermissionsForRole()).not.toContain('manage_menu');
  });

  test('uses role defaults when explicit permissions are absent', () => {
    expect(hasPermission({ role: 'staff' }, 'view_orders')).toBe(true);
    expect(hasPermission({ role: 'staff' }, 'manage_menu')).toBe(false);
    expect(hasPermission({}, 'create_order')).toBe(true);
  });

  test('explicit permissions take priority, including an empty array', () => {
    expect(
      hasPermission({ role: 'admin', permissions: [] }, 'view_orders'),
    ).toBe(false);
    expect(
      hasPermission(
        { role: 'customer', permissions: ['view_orders'] },
        'view_orders',
      ),
    ).toBe(true);
  });

  test('rejects missing users', () => {
    expect(hasPermission(null, 'view_orders')).toBe(false);
    expect(hasPermission(undefined, 'view_orders')).toBe(false);
  });
});
