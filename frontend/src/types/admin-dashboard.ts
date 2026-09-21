import type { OrderStatus } from './order';

export interface DashboardTopItem {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenueCents: number;
}

export interface AdminDashboardSummary {
  todayRevenueCents: number;
  todayOrderCount: number;
  activeOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  averagePreparationMinutes: number | null;
  topItems: DashboardTopItem[];
}

export type AnalyticsRange = '7d' | '30d';

export interface DashboardCategorySale {
  category: string;
  quantitySold: number;
  revenueCents: number;
}

export interface DashboardPaymentStatusCount {
  status: string;
  count: number;
}

export interface AdminAnalyticsSummary {
  range: AnalyticsRange;
  currency: 'AUD';
  startAt: string;
  endAt: string;
  revenueCents: number;
  orderCount: number;
  paidOrderCount: number;
  averageOrderValueCents: number;
  categorySales: DashboardCategorySale[];
  topItems: DashboardTopItem[];
  underperformingItems: DashboardTopItem[];
  paymentStatusCounts: DashboardPaymentStatusCount[];
}

export interface DailyBriefMetric {
  value: number;
  deltaPercent: number | null;
}

export interface AdminDailyBrief {
  date: string;
  comparison: 'same_weekday_last_week';
  metrics: {
    revenueCents: DailyBriefMetric;
    orderCount: DailyBriefMetric;
    averageOrderValueCents: DailyBriefMetric;
  };
  highlights: string[];
  worthChecking: string[];
}

export type AnalyticsAlertType =
  | 'high_cancellation_rate'
  | 'low_paid_order_rate'
  | 'revenue_drop';

export type AnalyticsAlertSeverity = 'low' | 'medium' | 'high';

export interface AdminAnalyticsAlert {
  id: string;
  type: AnalyticsAlertType;
  severity: AnalyticsAlertSeverity;
  title: string;
  message: string;
  evidence: string[];
  metricValue: number;
  threshold: number;
  range: AnalyticsRange;
  createdAt: string;
}
