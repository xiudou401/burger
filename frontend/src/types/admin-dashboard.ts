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
