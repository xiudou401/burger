import type { OrderStatus } from '../types/order';

interface OrderItemSummaryInput {
  name: string;
  quantity: number;
}

interface SummarizeOrderItemsOptions {
  limit?: number;
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const formatOrderShortId = (orderId: string): string => {
  return orderId.slice(-6).toUpperCase();
};

export const formatOrderStatus = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status];
};

export const summarizeOrderItems = (
  items: OrderItemSummaryInput[],
  options: SummarizeOrderItemsOptions = {},
): string => {
  const itemsToSummarize =
    options.limit === undefined ? items : items.slice(0, options.limit);

  return itemsToSummarize
    .map((item) => `${item.quantity} x ${item.name}`)
    .join(', ');
};
