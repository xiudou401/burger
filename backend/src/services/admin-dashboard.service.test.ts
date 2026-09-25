import { orderRepository } from '../repositories/order.repository';
import { menuItemRepository } from '../repositories/menu-item.repository';
import {
  getAdminAnalyticsSummary,
  getAdminDailyBrief,
  getAdminDashboardSummary,
} from './admin-dashboard.service';

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    listCreatedBetween: jest.fn(),
    listPaidBetween: jest.fn(),
    countActive: jest.fn(),
    getAnalyticsTotals: jest.fn(),
    getAnalyticsCategorySales: jest.fn(),
    getAnalyticsItemSales: jest.fn(),
    getAnalyticsPaymentStatusCounts: jest.fn(),
  },
}));

jest.mock('../repositories/menu-item.repository', () => ({
  menuItemRepository: {
    findAllForAnalytics: jest.fn(),
  },
}));

describe('admin dashboard service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summarizes today revenue, order status counts, prep time, and top items', async () => {
    const now = new Date('2026-07-10T04:00:00.000Z');
    const paidAt = new Date('2026-07-10T00:00:00.000Z');

    jest.mocked(orderRepository.countActive).mockResolvedValue(2);
    jest.mocked(orderRepository.listPaidBetween).mockResolvedValue([
      {
        status: 'ready',
        totalCents: 2400,
        payment: {
          status: 'paid',
          paidAt,
        },
        updatedAt: new Date('2026-07-10T00:18:00.000Z'),
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
          paidAt: new Date('2026-07-10T01:00:00.000Z'),
        },
        updatedAt: new Date('2026-07-10T01:05:00.000Z'),
        items: [
          {
            menuItemId: 'menu-2',
            nameAtPurchase: 'Fries',
            quantity: 1,
            subtotalCents: 900,
          },
        ],
      },
    ] as never);
    jest.mocked(orderRepository.listCreatedBetween).mockResolvedValue([
      {
        status: 'ready',
        totalCents: 2400,
        payment: {
          status: 'paid',
          paidAt,
        },
        updatedAt: new Date('2026-07-10T00:18:00.000Z'),
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
          paidAt: new Date('2026-07-10T01:00:00.000Z'),
        },
        updatedAt: new Date('2026-07-10T01:05:00.000Z'),
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
        updatedAt: new Date('2026-07-10T02:00:00.000Z'),
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
        confirmed: 0,
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
      new Date('2026-07-09T14:00:00.000Z'),
      new Date('2026-07-10T14:00:00.000Z'),
    );
    expect(orderRepository.listPaidBetween).toHaveBeenCalledWith(
      new Date('2026-07-09T14:00:00.000Z'),
      new Date('2026-07-10T14:00:00.000Z'),
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
    jest.mocked(menuItemRepository.findAllForAnalytics).mockResolvedValue([
      {
        _id: { toString: () => 'menu-3' },
        name: 'Vanilla Soft Serve',
        category: 'dessert',
      },
    ] as never);

    await expect(getAdminAnalyticsSummary('7d', now)).resolves.toEqual({
      range: '7d',
      currency: 'AUD',
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
        {
          menuItemId: 'menu-3',
          name: 'Vanilla Soft Serve',
          quantitySold: 0,
          revenueCents: 0,
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

  test('uses Australia/Sydney business day boundaries for today summary', async () => {
    const now = new Date('2026-01-01T13:30:00.000Z');

    jest.mocked(orderRepository.countActive).mockResolvedValue(0);
    jest.mocked(orderRepository.listCreatedBetween).mockResolvedValue([]);
    jest.mocked(orderRepository.listPaidBetween).mockResolvedValue([]);

    await getAdminDashboardSummary(now);

    expect(orderRepository.listCreatedBetween).toHaveBeenCalledWith(
      new Date('2026-01-01T13:00:00.000Z'),
      new Date('2026-01-02T13:00:00.000Z'),
    );
  });

  test('builds a daily brief from yesterday compared with the same weekday last week', async () => {
    const now = new Date('2026-09-22T01:00:00.000Z');

    jest
      .mocked(orderRepository.getAnalyticsTotals)
      .mockResolvedValueOnce({
        orderCount: 10,
        paidOrderCount: 9,
        revenueCents: 22000,
        averageOrderValueCents: 2444,
      })
      .mockResolvedValueOnce({
        orderCount: 8,
        paidOrderCount: 8,
        revenueCents: 20000,
        averageOrderValueCents: 2500,
      });
    jest
      .mocked(orderRepository.getAnalyticsItemSales)
      .mockResolvedValueOnce([
        {
          menuItemId: 'menu-1',
          name: 'Double Burger',
          quantitySold: 12,
          revenueCents: 14400,
        },
        {
          menuItemId: 'menu-2',
          name: 'Vegetarian Burger',
          quantitySold: 2,
          revenueCents: 2800,
        },
      ])
      .mockResolvedValueOnce([
        {
          menuItemId: 'menu-2',
          name: 'Vegetarian Burger',
          quantitySold: 7,
          revenueCents: 9800,
        },
      ]);
    jest
      .mocked(orderRepository.getAnalyticsPaymentStatusCounts)
      .mockResolvedValueOnce([
        { status: 'paid', count: 9 },
        { status: 'failed', count: 3 },
      ])
      .mockResolvedValueOnce([
        { status: 'paid', count: 8 },
        { status: 'failed', count: 1 },
      ]);

    await expect(getAdminDailyBrief(now)).resolves.toEqual({
      date: '21/09/2026',
      comparison: 'same_weekday_last_week',
      metrics: {
        revenueCents: {
          value: 22000,
          deltaPercent: 10,
        },
        orderCount: {
          value: 10,
          deltaPercent: 25,
        },
        averageOrderValueCents: {
          value: 2444,
          deltaPercent: -2,
        },
      },
      highlights: [
        'Revenue was A$220.00 (+10% vs the same weekday last week).',
        'Orders were 10 (+25%).',
        'Average order value was A$24.44 (-2%).',
        'Double Burger was the strongest seller with 12 sold.',
        'Vegetarian Burger sold 2, down from 7 on the same weekday last week.',
        'Payment failures increased from 1 to 3.',
      ],
      worthChecking: [
        'Vegetarian Burger availability, placement, and pairing.',
        'Payment failures and Stripe checkout logs.',
      ],
    });

    expect(orderRepository.getAnalyticsTotals).toHaveBeenNthCalledWith(1, {
      start: new Date('2026-09-20T14:00:00.000Z'),
      end: new Date('2026-09-21T14:00:00.000Z'),
    });
    expect(orderRepository.getAnalyticsTotals).toHaveBeenNthCalledWith(2, {
      start: new Date('2026-09-13T14:00:00.000Z'),
      end: new Date('2026-09-14T14:00:00.000Z'),
    });
  });
});
