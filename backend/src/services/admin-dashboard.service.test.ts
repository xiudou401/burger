import { orderRepository } from '../repositories/order.repository';
import { getAdminDashboardSummary } from './admin-dashboard.service';

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    listCreatedBetween: jest.fn(),
    countActive: jest.fn(),
  },
}));

describe('admin dashboard service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summarizes today revenue, order status counts, prep time, and top items', async () => {
    const now = new Date(2026, 6, 10, 14);
    const paidAt = new Date(2026, 6, 10, 10);

    jest.mocked(orderRepository.countActive).mockResolvedValue(2);
    jest.mocked(orderRepository.listCreatedBetween).mockResolvedValue([
      {
        status: 'ready',
        totalCents: 2400,
        payment: {
          status: 'paid',
          paidAt,
        },
        updatedAt: new Date(2026, 6, 10, 10, 18),
        items: [
          {
            menuItemId: 'menu-1',
            nameAtPurchase: 'Classic Burger',
            quantity: 2,
            subtotalCents: 2400,
          },
        ],
      },
      {
        status: 'preparing',
        totalCents: 900,
        payment: {
          status: 'paid',
          paidAt: new Date(2026, 6, 10, 11),
        },
        updatedAt: new Date(2026, 6, 10, 11, 5),
        items: [
          {
            menuItemId: 'menu-2',
            nameAtPurchase: 'Fries',
            quantity: 1,
            subtotalCents: 900,
          },
        ],
      },
      {
        status: 'pending_payment',
        totalCents: 1200,
        payment: {
          status: 'requires_payment',
        },
        updatedAt: new Date(2026, 6, 10, 12),
        items: [
          {
            menuItemId: 'menu-3',
            nameAtPurchase: 'Shake',
            quantity: 1,
            subtotalCents: 1200,
          },
        ],
      },
    ] as never);

    await expect(getAdminDashboardSummary(now)).resolves.toEqual({
      todayRevenueCents: 3300,
      todayOrderCount: 3,
      activeOrders: 2,
      ordersByStatus: {
        pending_payment: 1,
        paid: 0,
        preparing: 1,
        ready: 1,
        completed: 0,
        cancelled: 0,
      },
      averagePreparationMinutes: 18,
      topItems: [
        {
          menuItemId: 'menu-1',
          name: 'Classic Burger',
          quantitySold: 2,
          revenueCents: 2400,
        },
        {
          menuItemId: 'menu-2',
          name: 'Fries',
          quantitySold: 1,
          revenueCents: 900,
        },
      ],
    });

    expect(orderRepository.listCreatedBetween).toHaveBeenCalledWith(
      new Date(2026, 6, 10),
      new Date(2026, 6, 11),
    );
  });
});
