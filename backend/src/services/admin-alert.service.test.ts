import { orderRepository } from '../repositories/order.repository';
import { getAdminAnalyticsSummary } from './admin-dashboard.service';
import { emitAnalyticsAlert } from './realtime.service';
import {
  detectAnalyticsAlerts,
  emitCurrentAnalyticsAlerts,
  resetAnalyticsAlertEmitCooldownForTest,
} from './admin-alert.service';

jest.mock('../repositories/order.repository', () => ({
  orderRepository: {
    getAnalyticsTotals: jest.fn(),
  },
}));

jest.mock('./admin-dashboard.service', () => ({
  getAdminAnalyticsSummary: jest.fn(),
}));

jest.mock('./realtime.service', () => ({
  emitAnalyticsAlert: jest.fn(),
}));

const baseAnalytics = {
  range: '7d' as const,
  currency: 'AUD' as const,
  startAt: new Date('2026-09-13T12:00:00.000Z'),
  endAt: new Date('2026-09-20T12:00:00.000Z'),
  revenueCents: 12_000,
  orderCount: 10,
  paidOrderCount: 8,
  averageOrderValueCents: 1500,
  categorySales: [],
  topItems: [],
  underperformingItems: [],
  paymentStatusCounts: [
    { status: 'unpaid', count: 0 },
    { status: 'requires_payment', count: 0 },
    { status: 'paid', count: 8 },
    { status: 'failed', count: 0 },
    { status: 'cancelled', count: 2 },
    { status: 'refunded', count: 0 },
  ],
};

describe('admin alert service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAnalyticsAlertEmitCooldownForTest();
  });

  test('detects cancellation, paid-rate, and revenue-drop alerts from deterministic analytics', async () => {
    jest.mocked(getAdminAnalyticsSummary).mockResolvedValue({
      ...baseAnalytics,
      revenueCents: 9_000,
      paidOrderCount: 6,
      paymentStatusCounts: [
        { status: 'unpaid', count: 0 },
        { status: 'requires_payment', count: 2 },
        { status: 'paid', count: 6 },
        { status: 'failed', count: 0 },
        { status: 'cancelled', count: 2 },
        { status: 'refunded', count: 0 },
      ],
    });
    jest.mocked(orderRepository.getAnalyticsTotals).mockResolvedValue({
      orderCount: 12,
      paidOrderCount: 9,
      revenueCents: 15_000,
      averageOrderValueCents: 1667,
    });

    const alerts = await detectAnalyticsAlerts(
      '7d',
      new Date('2026-09-20T12:00:00.000Z'),
    );

    expect(alerts.map((alert) => alert.type)).toEqual([
      'high_cancellation_rate',
      'low_paid_order_rate',
      'revenue_drop',
    ]);
    expect(alerts[2].evidence).toContain('Current revenue is A$90.00.');
    expect(alerts[2].evidence).toContain('Previous revenue was A$150.00.');
    expect(orderRepository.getAnalyticsTotals).toHaveBeenCalledWith({
      start: new Date('2026-09-06T12:00:00.000Z'),
      end: new Date('2026-09-13T12:00:00.000Z'),
    });
  });

  test('does not emit noisy rate alerts for very small order samples', async () => {
    jest.mocked(getAdminAnalyticsSummary).mockResolvedValue({
      ...baseAnalytics,
      orderCount: 2,
      paidOrderCount: 1,
      paymentStatusCounts: [
        { status: 'paid', count: 1 },
        { status: 'cancelled', count: 1 },
      ],
    });

    await expect(detectAnalyticsAlerts('7d')).resolves.toEqual([]);
  });

  test('deduplicates realtime alert emits during the cooldown window', async () => {
    jest.mocked(getAdminAnalyticsSummary).mockResolvedValue({
      ...baseAnalytics,
      paidOrderCount: 9,
      paymentStatusCounts: [
        { status: 'paid', count: 9 },
        { status: 'cancelled', count: 1 },
      ],
    });
    jest.mocked(orderRepository.getAnalyticsTotals).mockResolvedValue({
      orderCount: 10,
      paidOrderCount: 8,
      revenueCents: 12_000,
      averageOrderValueCents: 1500,
    });

    await emitCurrentAnalyticsAlerts(new Date('2026-09-20T12:00:00.000Z'));
    await emitCurrentAnalyticsAlerts(new Date('2026-09-20T12:01:00.000Z'));
    await emitCurrentAnalyticsAlerts(new Date('2026-09-20T12:06:00.000Z'));

    expect(emitAnalyticsAlert).toHaveBeenCalledTimes(2);
    expect(jest.mocked(emitAnalyticsAlert).mock.calls[0][0]).toMatchObject({
      id: '7d:high_cancellation_rate',
      severity: 'medium',
    });
  });
});
