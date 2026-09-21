import { orderRepository } from '../repositories/order.repository';
import {
  getAdminAnalyticsSummary,
  type AnalyticsRange,
  type AdminAnalyticsSummary,
} from './admin-dashboard.service';
import { emitAnalyticsAlert } from './realtime.service';
import { appLogger } from '../utils/logger';

export type AnalyticsAlertType =
  | 'high_cancellation_rate'
  | 'low_paid_order_rate'
  | 'revenue_drop';

export type AnalyticsAlertSeverity = 'low' | 'medium' | 'high';

export interface AnalyticsAlert {
  id: string;
  type: AnalyticsAlertType;
  severity: AnalyticsAlertSeverity;
  title: string;
  message: string;
  evidence: string[];
  metricValue: number;
  threshold: number;
  range: AnalyticsRange;
  createdAt: Date;
}

const MIN_ORDERS_FOR_RATE_ALERTS = 5;
const MIN_PAID_ORDERS_FOR_REVENUE_DROP = 3;
const HIGH_CANCELLATION_RATE = 0.1;
const LOW_PAID_ORDER_RATE = 0.75;
const REVENUE_DROP_RATE = 0.2;

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
};

const formatPercent = (value: number) => `${Math.round(value * 1000) / 10}%`;
const formatAud = (cents: number) => `A$${(cents / 100).toFixed(2)}`;

const getPaymentCount = (analytics: AdminAnalyticsSummary, status: string) =>
  analytics.paymentStatusCounts.find((entry) => entry.status === status)
    ?.count ?? 0;

const getPreviousRange = (range: AnalyticsRange, end: Date) => {
  const currentStart = new Date(end);
  currentStart.setDate(currentStart.getDate() - RANGE_DAYS[range]);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - RANGE_DAYS[range]);

  return {
    start: previousStart,
    end: currentStart,
  };
};

const createAlert = (
  input: Omit<AnalyticsAlert, 'createdAt'>,
): AnalyticsAlert => ({
  ...input,
  createdAt: new Date(),
});

export const detectAnalyticsAlerts = async (
  range: AnalyticsRange = '7d',
  now = new Date(),
): Promise<AnalyticsAlert[]> => {
  const analytics = await getAdminAnalyticsSummary(range, now);
  const alerts: AnalyticsAlert[] = [];

  if (analytics.orderCount >= MIN_ORDERS_FOR_RATE_ALERTS) {
    const cancelledOrders = getPaymentCount(analytics, 'cancelled');
    const cancellationRate = cancelledOrders / analytics.orderCount;

    if (cancellationRate >= HIGH_CANCELLATION_RATE) {
      alerts.push(
        createAlert({
          id: `${range}:high_cancellation_rate`,
          type: 'high_cancellation_rate',
          severity: cancellationRate >= 0.2 ? 'high' : 'medium',
          title: 'High cancellation rate',
          message: `${formatPercent(
            cancellationRate,
          )} of orders were cancelled in the current ${range} window.`,
          evidence: [
            `${cancelledOrders} of ${analytics.orderCount} orders are cancelled.`,
            `Alert threshold is ${formatPercent(HIGH_CANCELLATION_RATE)}.`,
          ],
          metricValue: cancellationRate,
          threshold: HIGH_CANCELLATION_RATE,
          range,
        }),
      );
    }

    const paidOrderRate = analytics.paidOrderCount / analytics.orderCount;

    if (paidOrderRate <= LOW_PAID_ORDER_RATE) {
      alerts.push(
        createAlert({
          id: `${range}:low_paid_order_rate`,
          type: 'low_paid_order_rate',
          severity: paidOrderRate <= 0.6 ? 'high' : 'medium',
          title: 'Low paid order rate',
          message: `${formatPercent(
            paidOrderRate,
          )} of created orders became paid orders in the current ${range} window.`,
          evidence: [
            `${analytics.paidOrderCount} of ${analytics.orderCount} orders are paid.`,
            `Alert threshold is ${formatPercent(LOW_PAID_ORDER_RATE)} or lower.`,
          ],
          metricValue: paidOrderRate,
          threshold: LOW_PAID_ORDER_RATE,
          range,
        }),
      );
    }
  }

  if (analytics.paidOrderCount >= MIN_PAID_ORDERS_FOR_REVENUE_DROP) {
    const previousRange = getPreviousRange(range, now);
    const previousTotals =
      await orderRepository.getAnalyticsTotals(previousRange);

    if (previousTotals.revenueCents > 0) {
      const revenueDropRate =
        (previousTotals.revenueCents - analytics.revenueCents) /
        previousTotals.revenueCents;

      if (revenueDropRate >= REVENUE_DROP_RATE) {
        alerts.push(
          createAlert({
            id: `${range}:revenue_drop`,
            type: 'revenue_drop',
            severity: revenueDropRate >= 0.35 ? 'high' : 'medium',
            title: 'Revenue dropped from previous period',
            message: `Revenue is down ${formatPercent(
              revenueDropRate,
            )} compared with the previous ${range} window.`,
            evidence: [
              `Current revenue is ${formatAud(analytics.revenueCents)}.`,
              `Previous revenue was ${formatAud(previousTotals.revenueCents)}.`,
              `Alert threshold is ${formatPercent(REVENUE_DROP_RATE)}.`,
            ],
            metricValue: revenueDropRate,
            threshold: REVENUE_DROP_RATE,
            range,
          }),
        );
      }
    }
  }

  return alerts;
};

export const emitCurrentAnalyticsAlerts = async () => {
  try {
    const alerts = await detectAnalyticsAlerts('7d');

    for (const alert of alerts) {
      emitAnalyticsAlert(alert);
    }
  } catch (error) {
    appLogger.warn('analytics_alert_detection_failed', { error });
  }
};
