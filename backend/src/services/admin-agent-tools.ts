import { z } from 'zod';
import {
  type CancellationReason,
  type OrderStatus,
  type PaymentStatus,
} from '../models/order.model';
import {
  MENU_ITEM_CATEGORIES,
  type MenuItemCategory,
} from '../models/menu-item.model';
import { orderRepository } from '../repositories/order.repository';
import type { AdminInsightResponsePayload } from '../validation/admin-insight.schema';

export const ADMIN_GET_ORDERS_TOOL = 'getOrders';
export const ADMIN_GET_ITEM_PERFORMANCE_TOOL = 'getItemPerformance';
export const ADMIN_GET_PAYMENT_STATS_TOOL = 'getPaymentStats';
export const ADMIN_GET_SALES_METRICS_TOOL = 'getSalesMetrics';
export const ADMIN_GET_CANCELLATION_BREAKDOWN_TOOL = 'getCancellationBreakdown';

const OrderStatusSchema = z.enum([
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]);

const PaymentStatusSchema = z.enum([
  'unpaid',
  'requires_payment',
  'paid',
  'failed',
  'cancelled',
  'refunded',
]);

const CancellationReasonSchema = z.enum([
  'payment_failed',
  'customer_abandoned_checkout',
  'staff_cancelled',
  'item_unavailable',
  'duplicate_order',
  'other',
]);

const ToolDateRangeShape = {
  from: z.date(),
  to: z.date(),
};

const hasValidToolDateRange = (value: { from: Date; to: Date }) =>
  value.from < value.to;

export const GetOrdersToolParamsSchema = z
  .object({
    ...ToolDateRangeShape,
    status: OrderStatusSchema.optional(),
    paymentStatus: PaymentStatusSchema.optional(),
    cancellationReason: CancellationReasonSchema.optional(),
    sort: z
      .enum(['updated_desc', 'created_desc', 'total_desc'])
      .default('updated_desc'),
    limit: z.number().int().min(1).max(10).default(5),
  })
  .strict()
  .refine(hasValidToolDateRange, {
    message: 'Tool date range must have from before to',
  });

export const GetItemPerformanceToolParamsSchema = z
  .object({
    ...ToolDateRangeShape,
    category: z.enum(MENU_ITEM_CATEGORIES).optional(),
    sort: z.enum([
      'quantity_desc',
      'quantity_asc',
      'revenue_desc',
      'revenue_asc',
    ]),
    limit: z.number().int().min(1).max(10).default(5),
  })
  .strict()
  .refine(hasValidToolDateRange, {
    message: 'Tool date range must have from before to',
  });

export type GetOrdersToolParams = z.infer<typeof GetOrdersToolParamsSchema>;
export type GetItemPerformanceToolParams = z.infer<
  typeof GetItemPerformanceToolParamsSchema
>;

interface CountEntry<T extends string = string> {
  value: T;
  count: number;
  percentage: number;
}

export interface CancellationBreakdown {
  totalCancelled: number;
  byReason: CountEntry<CancellationReason | 'unknown'>[];
  byPaymentStatus: CountEntry<PaymentStatus | 'unknown'>[];
  byTimeWindow: CountEntry[];
  byCategory: CountEntry<MenuItemCategory | 'unknown'>[];
  byItem: CountEntry[];
  dominantReason?: CountEntry<CancellationReason | 'unknown'>;
  dominantPaymentStatus?: CountEntry<PaymentStatus | 'unknown'>;
  dominantTimeWindow?: CountEntry;
  dominantCategory?: CountEntry<MenuItemCategory | 'unknown'>;
  dominantItem?: CountEntry;
}

export interface AdminToolCallResult<TParams, TResult> {
  name: string;
  params: TParams;
  result: TResult;
}

const toOrderEvidence = (
  orders: Awaited<ReturnType<typeof orderRepository.queryOrders>>,
): AdminInsightResponsePayload['orderEvidence'] =>
  orders.map((order) => ({
    orderId: String(order._id),
    status: order.status,
    paymentStatus: order.payment?.status,
    cancellationReason: order.cancellationReason,
    cancelledAt: order.cancelledAt?.toISOString(),
    totalCents: order.totalCents,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items
      .slice(0, 6)
      .map((item) => item.nameAtPurchase ?? 'Menu item'),
    itemCategories: order.items
      .slice(0, 6)
      .map((item) => item.categoryAtPurchase ?? 'unknown'),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));

const incrementCount = <T extends string>(
  counts: Map<T, number>,
  value: T,
  amount = 1,
) => counts.set(value, (counts.get(value) ?? 0) + amount);

const toCountEntries = <T extends string>(
  counts: Map<T, number>,
  total: number,
): CountEntry<T>[] =>
  [...counts.entries()]
    .map(([value, count]) => ({
      value,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

const getOperationalTimeWindow = (timestamp: string) => {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'late';
};

export const buildCancellationBreakdown = (
  orderEvidence: AdminInsightResponsePayload['orderEvidence'],
): CancellationBreakdown => {
  const reasonCounts = new Map<CancellationReason | 'unknown', number>();
  const paymentCounts = new Map<PaymentStatus | 'unknown', number>();
  const timeWindowCounts = new Map<string, number>();
  const categoryCounts = new Map<MenuItemCategory | 'unknown', number>();
  const itemCounts = new Map<string, number>();
  const totalCancelled = orderEvidence?.length ?? 0;

  for (const order of orderEvidence ?? []) {
    incrementCount(reasonCounts, order.cancellationReason ?? 'unknown');
    incrementCount(paymentCounts, order.paymentStatus ?? 'unknown');
    incrementCount(
      timeWindowCounts,
      getOperationalTimeWindow(order.cancelledAt ?? order.updatedAt),
    );

    for (const category of order.itemCategories ?? []) {
      incrementCount(categoryCounts, category);
    }

    for (const item of order.items) {
      incrementCount(itemCounts, item);
    }
  }

  const byReason = toCountEntries(reasonCounts, totalCancelled);
  const byPaymentStatus = toCountEntries(paymentCounts, totalCancelled);
  const byTimeWindow = toCountEntries(timeWindowCounts, totalCancelled);
  const byCategory = toCountEntries(categoryCounts, totalCancelled);
  const byItem = toCountEntries(itemCounts, totalCancelled);

  return {
    totalCancelled,
    byReason,
    byPaymentStatus,
    byTimeWindow,
    byCategory,
    byItem,
    dominantReason: byReason[0],
    dominantPaymentStatus: byPaymentStatus[0],
    dominantTimeWindow: byTimeWindow[0],
    dominantCategory: byCategory[0],
    dominantItem: byItem[0],
  };
};

const getItemPerformanceSort = (sort: GetItemPerformanceToolParams['sort']) => {
  switch (sort) {
    case 'quantity_asc':
      return { quantitySold: 1 as const, revenueCents: 1 as const };
    case 'revenue_desc':
      return { revenueCents: -1 as const, quantitySold: -1 as const };
    case 'revenue_asc':
      return { revenueCents: 1 as const, quantitySold: 1 as const };
    case 'quantity_desc':
    default:
      return { quantitySold: -1 as const, revenueCents: -1 as const };
  }
};

export const runGetOrdersTool = async (
  params: GetOrdersToolParams,
): Promise<
  AdminToolCallResult<
    GetOrdersToolParams,
    AdminInsightResponsePayload['orderEvidence']
  >
> => {
  const parsed = GetOrdersToolParamsSchema.parse(params);
  const orders = await orderRepository.queryOrders({
    start: parsed.from,
    end: parsed.to,
    status: parsed.status,
    paymentStatus: parsed.paymentStatus,
    cancellationReason: parsed.cancellationReason,
    sort: parsed.sort,
    limit: parsed.limit,
  });

  return {
    name: ADMIN_GET_ORDERS_TOOL,
    params: parsed,
    result: toOrderEvidence(orders),
  };
};

export const runGetCancellationBreakdownTool = (
  orderEvidence: AdminInsightResponsePayload['orderEvidence'],
) => ({
  name: ADMIN_GET_CANCELLATION_BREAKDOWN_TOOL,
  params: {
    orderEvidenceCount: orderEvidence?.length ?? 0,
  },
  result: buildCancellationBreakdown(orderEvidence),
});

export const runGetItemPerformanceTool = async (
  params: GetItemPerformanceToolParams,
) => {
  const parsed = GetItemPerformanceToolParamsSchema.parse(params);
  const result = await orderRepository.getAnalyticsItemSales({
    start: parsed.from,
    end: parsed.to,
    category: parsed.category,
    sort: getItemPerformanceSort(parsed.sort),
    limit: parsed.limit,
  });

  return {
    name: ADMIN_GET_ITEM_PERFORMANCE_TOOL,
    params: parsed,
    result,
  };
};

export const runGetPaymentStatsTool = async (
  params: Pick<GetOrdersToolParams, 'from' | 'to'>,
) => {
  const parsed = z
    .object(ToolDateRangeShape)
    .strict()
    .refine(hasValidToolDateRange, {
      message: 'Tool date range must have from before to',
    })
    .parse(params);
  const result = await orderRepository.getAnalyticsPaymentStatusCounts({
    start: parsed.from,
    end: parsed.to,
  });

  return {
    name: ADMIN_GET_PAYMENT_STATS_TOOL,
    params: parsed,
    result,
  };
};

export const getOrderStatusFromQuestion = (
  question: string,
): OrderStatus | undefined => {
  const normalized = question.toLowerCase();

  if (
    /\bcancell?ed\b/.test(normalized) ||
    /\bcancell?ations?\b/.test(normalized)
  ) {
    return 'cancelled';
  }

  if (/\bpending\b/.test(normalized) || /\bunpaid\b/.test(normalized)) {
    return 'pending_payment';
  }

  if (/\bpreparing\b/.test(normalized)) return 'preparing';
  if (/\bready\b/.test(normalized)) return 'ready';
  if (/\bcompleted\b/.test(normalized)) return 'completed';
  if (/\bpaid\b/.test(normalized)) return 'paid';

  return undefined;
};

export const getPaymentStatusFromQuestion = (
  question: string,
): PaymentStatus | undefined => {
  const normalized = question.toLowerCase();

  if (/\bfailed\b/.test(normalized)) return 'failed';
  if (/\brefund/.test(normalized)) return 'refunded';
  if (/\bcancell?ed\b/.test(normalized)) return 'cancelled';
  if (/\brequires payment\b/.test(normalized)) return 'requires_payment';
  if (/\bunpaid\b/.test(normalized)) return 'unpaid';
  if (/\bpaid\b/.test(normalized)) return 'paid';

  return undefined;
};

export const getCancellationReasonFromQuestion = (
  question: string,
): CancellationReason | undefined => {
  const normalized = question.toLowerCase();

  if (/\bpayment failed\b/.test(normalized)) return 'payment_failed';
  if (/\babandoned\b/.test(normalized)) return 'customer_abandoned_checkout';
  if (/\bstaff\b/.test(normalized)) return 'staff_cancelled';
  if (/\bunavailable\b/.test(normalized)) return 'item_unavailable';
  if (/\bduplicate\b/.test(normalized)) return 'duplicate_order';
  if (/\bother\b/.test(normalized)) return 'other';

  return undefined;
};

export const getMenuCategoryFromQuestion = (question: string) => {
  const normalized = question.toLowerCase();

  return MENU_ITEM_CATEGORIES.find((category) => normalized.includes(category));
};

export const getOrderSortFromQuestion = (
  question: string,
): GetOrdersToolParams['sort'] => {
  const normalized = question.toLowerCase();

  if (
    /\bexpensive\b/.test(normalized) ||
    /\bhighest\b/.test(normalized) ||
    /\bmost\b/.test(normalized)
  ) {
    return 'total_desc';
  }

  if (/\bcreated\b/.test(normalized) || /\brecent\b/.test(normalized)) {
    return 'created_desc';
  }

  return 'updated_desc';
};

export const getItemPerformanceSortFromQuestion = (
  question: string,
): GetItemPerformanceToolParams['sort'] => {
  const normalized = question.toLowerCase();

  if (
    /\bworst\b/.test(normalized) ||
    /\blower\b/.test(normalized) ||
    /\bunderperform/.test(normalized) ||
    /\bweak\b/.test(normalized)
  ) {
    return 'quantity_asc';
  }

  if (/\brevenue\b/.test(normalized)) {
    return /\blow\b/.test(normalized) ? 'revenue_asc' : 'revenue_desc';
  }

  return 'quantity_desc';
};
