import { orderRepository } from '../repositories/order.repository';
import {
  getAdminAnalyticsSummary,
  getAdminDashboardSummary,
} from './admin-dashboard.service';

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    listCreatedBetween: jest.fn(),
    countActive: jest.fn(),
    getAnalyticsTotals: jest.fn(),
    getAnalyticsCategorySales: jest.fn(),
    getAnalyticsItemSales: jest.fn(),
    getAnalyticsPaymentStatusCounts: jest.fn(),
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

  test('summarizes analytics from MongoDB aggregation results', async () => {
    const now = new Date('2026-09-20T12:00:00.000Z');

    jest.mocked(orderRepository.getAnalyticsTotals).mockResolvedValue({
      orderCount: 12,
      paidOrderCount: 9,
      revenueCents: 18250,
      averageOrderValueCents: 2028,
    });
    jest.mocked(orderRepository.getAnalyticsCategorySales).mockResolvedValue([
      {
        category: 'burger',
        quantitySold: 18,
        revenueCents: 12600,
      },
      {
        category: 'dessert',
        quantitySold: 2,
        revenueCents: 1800,
      },
    ]);
    jest
      .mocked(orderRepository.getAnalyticsItemSales)
      .mockResolvedValueOnce([
        {
          menuItemId: 'menu-1',
          name: 'Classic Burger',
          quantitySold: 8,
          revenueCents: 9600,
        },
      ])
      .mockResolvedValueOnce([
        {
          menuItemId: 'menu-2',
          name: 'Chocolate Brownie',
          quantitySold: 1,
          revenueCents: 900,
        },
      ]);
    jest
      .mocked(orderRepository.getAnalyticsPaymentStatusCounts)
      .mockResolvedValue([
        { status: 'paid', count: 9 },
        { status: 'cancelled', count: 2 },
      ]);

    await expect(getAdminAnalyticsSummary('7d', now)).resolves.toEqual({
      range: '7d',
      startAt: new Date('2026-09-13T12:00:00.000Z'),
      endAt: now,
      revenueCents: 18250,
      orderCount: 12,
      paidOrderCount: 9,
      averageOrderValueCents: 2028,
      categorySales: [
        { category: 'burger', quantitySold: 18, revenueCents: 12600 },
        { category: 'side', quantitySold: 0, revenueCents: 0 },
        { category: 'drink', quantitySold: 0, revenueCents: 0 },
        { category: 'dessert', quantitySold: 2, revenueCents: 1800 },
        { category: 'combo', quantitySold: 0, revenueCents: 0 },
      ],
      topItems: [
        {
          menuItemId: 'menu-1',
          name: 'Classic Burger',
          quantitySold: 8,
          revenueCents: 9600,
        },
      ],
      underperformingItems: [
        {
          menuItemId: 'menu-2',
          name: 'Chocolate Brownie',
          quantitySold: 1,
          revenueCents: 900,
        },
      ],
      paymentStatusCounts: [
        { status: 'unpaid', count: 0 },
        { status: 'requires_payment', count: 0 },
        { status: 'paid', count: 9 },
        { status: 'failed', count: 0 },
        { status: 'cancelled', count: 2 },
        { status: 'refunded', count: 0 },
      ],
    });

    expect(orderRepository.getAnalyticsTotals).toHaveBeenCalledWith({
      start: new Date('2026-09-13T12:00:00.000Z'),
      end: now,
    });
    expect(orderRepository.getAnalyticsItemSales).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sort: { quantitySold: -1, revenueCents: -1 },
        limit: 5,
      }),
    );
    expect(orderRepository.getAnalyticsItemSales).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sort: { quantitySold: 1, revenueCents: 1 },
        limit: 5,
      }),
    );
  });
});
