import { getNextStatusesByUser } from '../utils/admin-order-status-permissions';
import { getPermissionsForRole } from '../../types/permissions';

describe('admin order status permissions', () => {
  test('allows admins to cancel paid and preparing orders before completion', () => {
    const nextStatuses = getNextStatusesByUser({
      id: 'admin-1',
      name: 'Admin',
      role: 'admin',
      permissions: getPermissionsForRole('admin'),
      emailVerified: true,
      phoneVerified: false,
    });

    expect(nextStatuses.paid).toEqual(['preparing', 'cancelled']);
    expect(nextStatuses.preparing).toEqual(['ready', 'cancelled']);
    expect(nextStatuses.completed).toEqual([]);
  });

  test('keeps staff focused on fulfillment transitions only', () => {
    const nextStatuses = getNextStatusesByUser({
      id: 'staff-1',
      name: 'Staff',
      role: 'staff',
      permissions: getPermissionsForRole('staff'),
      emailVerified: true,
      phoneVerified: false,
    });

    expect(nextStatuses.paid).toEqual(['preparing']);
    expect(nextStatuses.preparing).toEqual(['ready']);
    expect(nextStatuses.completed).toEqual([]);
    expect(nextStatuses.cancelled).toEqual([]);
  });
});
