import { getNextStatusesByRole } from './admin-order-status-permissions';

describe('admin order status permissions', () => {
  test('allows admins to cancel paid and preparing orders before completion', () => {
    const nextStatuses = getNextStatusesByRole('admin');

    expect(nextStatuses.paid).toEqual(['preparing', 'cancelled']);
    expect(nextStatuses.preparing).toEqual(['ready', 'cancelled']);
    expect(nextStatuses.completed).toEqual([]);
  });

  test('keeps staff focused on fulfillment transitions only', () => {
    const nextStatuses = getNextStatusesByRole('staff');

    expect(nextStatuses.paid).toEqual(['preparing']);
    expect(nextStatuses.preparing).toEqual(['ready']);
    expect(nextStatuses.completed).toEqual([]);
    expect(nextStatuses.cancelled).toEqual([]);
  });
});
