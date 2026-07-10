import type { OrderStatus } from '../models/order.model';
import { orderRepository } from '../repositories/order.repository';

interface DashboardOrderItem {
  menuItemId?: unknown;
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
