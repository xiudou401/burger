import { z } from 'zod';
import { type OrderStatus, type PaymentStatus } from '../models/order.model';
import { MENU_ITEM_CATEGORIES } from '../models/menu-item.model';
import { orderRepository } from '../repositories/order.repository';
import type { AdminInsightResponsePayload } from '../validation/admin-insight.schema';

export const ADMIN_GET_ORDERS_TOOL = 'getOrders';
export const ADMIN_GET_ITEM_PERFORMANCE_TOOL = 'getItemPerformance';
export const ADMIN_GET_PAYMENT_STATS_TOOL = 'getPaymentStats';
export const ADMIN_GET_SALES_METRICS_TOOL = 'getSalesMetrics';

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
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));

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
    sort: parsed.sort,
    limit: parsed.limit,
  });

  return {
    name: ADMIN_GET_ORDERS_TOOL,
    params: parsed,
    result: toOrderEvidence(orders),
  };
};

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
