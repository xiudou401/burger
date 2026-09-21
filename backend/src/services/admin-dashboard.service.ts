import type { OrderStatus } from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';
import { MENU_ITEM_CATEGORIES } from '../models/menu-item.model';
import { menuItemRepository } from '../repositories/menu-item.repository';

const BUSINESS_TIME_ZONE = 'Australia/Sydney';

interface DashboardOrderItem {
  menuItemId?: unknown;
  // Legacy fallback for orders created before menuItemId became the public name.
  mealId?: unknown;
  nameAtPurchase?: string;
  name?: string;
  categoryAtPurchase?: string;
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

const getTimeZoneParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = getTimeZoneParts(date, timeZone);
  const localAsUtcMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtcMs - date.getTime();
};

const zonedMidnightToUtc = ({
  year,
  month,
  day,
  timeZone,
}: {
  year: number;
  month: number;
  day: number;
  timeZone: string;
}) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offsetMs);
};

const startOfBusinessToday = (now = new Date()) => {
  const parts = getTimeZoneParts(now, BUSINESS_TIME_ZONE);

  return zonedMidnightToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    timeZone: BUSINESS_TIME_ZONE,
  });
};

const startOfNextBusinessDay = (now = new Date()) => {
  const parts = getTimeZoneParts(now, BUSINESS_TIME_ZONE);

  return zonedMidnightToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day + 1,
    timeZone: BUSINESS_TIME_ZONE,
  });
};

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
  const today = startOfBusinessToday(now);
  const tomorrow = startOfNextBusinessDay(now);

  const [orders, paidOrders, activeOrders] = await Promise.all([
    orderRepository.listCreatedBetween(today, tomorrow),
    orderRepository.listPaidBetween(today, tomorrow),
    orderRepository.countActive(),
  ]);

  const dashboardOrders = orders as DashboardOrder[];
  const dashboardPaidOrders = paidOrders as DashboardOrder[];
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

    const minutes = getPreparationMinutes(order);

    if (minutes !== null) {
      preparationMinutes.push(minutes);
    }
  }

  for (const order of dashboardPaidOrders) {
    todayRevenueCents += order.totalCents;
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
    topItems: summarizeTopItems(dashboardPaidOrders),
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

const includeZeroSaleMenuItems = async (
  itemSales: DashboardTopItem[],
  limit: number,
) => {
  if (itemSales.length >= limit) {
    return itemSales.slice(0, limit);
  }

  const soldItemIds = new Set(itemSales.map((item) => item.menuItemId));
  const menuItems = await menuItemRepository.findAllForAnalytics();
  const zeroSaleItems = menuItems
    .filter((item) => !soldItemIds.has(item._id.toString()))
    .map((item) => ({
      menuItemId: item._id.toString(),
      name: item.name,
      quantitySold: 0,
      revenueCents: 0,
    }));

  return [...itemSales, ...zeroSaleItems].slice(0, limit);
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

  const underperformingWithZeroSales = await includeZeroSaleMenuItems(
    underperformingItems,
    5,
  );

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
    underperformingItems: underperformingWithZeroSales,
    paymentStatusCounts: normalizePaymentStatusCounts(paymentStatusCounts),
  };
};
