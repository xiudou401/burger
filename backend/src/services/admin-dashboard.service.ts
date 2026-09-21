import type { OrderStatus } from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';
import { MENU_ITEM_CATEGORIES } from '../models/menu-item.model';

interface DashboardOrderItem {
  menuItemId?: unknown;
  // Legacy fallback for orders created before menuItemId became the public name.
  mealId?: unknown;
  nameAtPurchase?: string;
  name?: string;
  quantity: number;
  subtotalCents: number;
}

interface DashboardOrder {
  status: OrderStatus;
  totalCents: number;
  payment?: {
    status?: string;
    paidAt?: Date;
  };
  items: DashboardOrderItem[];
  updatedAt: Date;
}

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
  startAt: Date;
  endAt: Date;
  revenueCents: number;
  orderCount: number;
  paidOrderCount: number;
  averageOrderValueCents: number;
  categorySales: DashboardCategorySale[];
  topItems: DashboardTopItem[];
  underperformingItems: DashboardTopItem[];
  paymentStatusCounts: DashboardPaymentStatusCount[];
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const startOfToday = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate());

const startOfTomorrow = (today: Date) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

const isRevenueOrder = (order: DashboardOrder) =>
  order.payment?.status === 'paid';

const getPreparationMinutes = (order: DashboardOrder) => {
  if (
    order.payment?.status !== 'paid' ||
    !order.payment.paidAt ||
    (order.status !== 'ready' && order.status !== 'completed')
  ) {
    return null;
  }

  const elapsedMs =
    new Date(order.updatedAt).getTime() -
    new Date(order.payment.paidAt).getTime();

  return elapsedMs > 0 ? elapsedMs / 60_000 : null;
};

const summarizeTopItems = (orders: DashboardOrder[]) => {
  const topItems = new Map<string, DashboardTopItem>();

  for (const order of orders) {
    if (!isRevenueOrder(order)) continue;

    for (const item of order.items) {
      const menuItemId = String(item.menuItemId ?? item.mealId);
      const existing = topItems.get(menuItemId);
      const name = item.nameAtPurchase ?? item.name ?? 'Menu item';

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenueCents += item.subtotalCents;
      } else {
        topItems.set(menuItemId, {
          menuItemId,
          name,
          quantitySold: item.quantity,
          revenueCents: item.subtotalCents,
        });
      }
    }
  }

  return [...topItems.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);
};

export const getAdminDashboardSummary = async (
  now = new Date(),
): Promise<AdminDashboardSummary> => {
  const today = startOfToday(now);
  const tomorrow = startOfTomorrow(today);

  const [orders, activeOrders] = await Promise.all([
    orderRepository.listCreatedBetween(today, tomorrow),
    orderRepository.countActive(),
  ]);

  const dashboardOrders = orders as DashboardOrder[];
  const ordersByStatus = ORDER_STATUSES.reduce(
    (summary, status) => ({
      ...summary,
      [status]: 0,
    }),
    {} as Record<OrderStatus, number>,
  );

  let todayRevenueCents = 0;
  const preparationMinutes: number[] = [];

  for (const order of dashboardOrders) {
    ordersByStatus[order.status] += 1;

    if (isRevenueOrder(order)) {
      todayRevenueCents += order.totalCents;
    }

    const minutes = getPreparationMinutes(order);

    if (minutes !== null) {
      preparationMinutes.push(minutes);
    }
  }

  return {
    todayRevenueCents,
    todayOrderCount: dashboardOrders.length,
    activeOrders,
    ordersByStatus,
    averagePreparationMinutes:
      preparationMinutes.length > 0
        ? Math.round(
            preparationMinutes.reduce((sum, value) => sum + value, 0) /
              preparationMinutes.length,
          )
        : null,
    topItems: summarizeTopItems(dashboardOrders),
  };
};

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '7d': 7,
  '30d': 30,
};

const PAYMENT_STATUSES = [
  'unpaid',
  'requires_payment',
  'paid',
  'failed',
  'cancelled',
  'refunded',
];

const getRangeStart = (range: AnalyticsRange, now: Date) => {
  const start = new Date(now);
  start.setDate(start.getDate() - RANGE_DAYS[range]);
  return start;
};

const normalizeCategorySales = (sales: DashboardCategorySale[]) => {
  const salesByCategory = new Map(sales.map((sale) => [sale.category, sale]));

  return MENU_ITEM_CATEGORIES.map((category) => ({
    category,
    quantitySold: salesByCategory.get(category)?.quantitySold ?? 0,
    revenueCents: salesByCategory.get(category)?.revenueCents ?? 0,
  }));
};

const normalizePaymentStatusCounts = (
  counts: DashboardPaymentStatusCount[],
) => {
  const countByStatus = new Map(counts.map((entry) => [entry.status, entry]));

  return PAYMENT_STATUSES.map((status) => ({
    status,
    count: countByStatus.get(status)?.count ?? 0,
  }));
};

export const getAdminAnalyticsSummary = async (
  range: AnalyticsRange = '7d',
  now = new Date(),
): Promise<AdminAnalyticsSummary> => {
  const end = now;
  const start = getRangeStart(range, now);

  const [
    totals,
    categorySales,
    topItems,
    underperformingItems,
    paymentStatusCounts,
  ] = await Promise.all([
    orderRepository.getAnalyticsTotals({ start, end }),
    orderRepository.getAnalyticsCategorySales({ start, end }),
    orderRepository.getAnalyticsItemSales({
      start,
      end,
      sort: { quantitySold: -1, revenueCents: -1 },
      limit: 5,
    }),
    orderRepository.getAnalyticsItemSales({
      start,
      end,
      sort: { quantitySold: 1, revenueCents: 1 },
      limit: 5,
    }),
    orderRepository.getAnalyticsPaymentStatusCounts({ start, end }),
  ]);

  return {
    range,
    currency: 'AUD',
    startAt: start,
    endAt: end,
    revenueCents: totals.revenueCents,
    orderCount: totals.orderCount,
    paidOrderCount: totals.paidOrderCount,
    averageOrderValueCents: totals.averageOrderValueCents,
    categorySales: normalizeCategorySales(categorySales),
    topItems,
    underperformingItems,
    paymentStatusCounts: normalizePaymentStatusCounts(paymentStatusCounts),
  };
};
