import type { OrderStatus } from '../types/order';

export type StatusBadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

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

const ORDER_ACTION_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Mark pending',
  paid: 'Mark paid',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  completed: 'Complete order',
  cancelled: 'Cancel order',
};

export const formatOrderShortId = (orderId: string): string => {
  return orderId.slice(-6).toUpperCase();
};

export const formatOrderStatus = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status];
};

export const getOrderStatusVariant = (
  status: OrderStatus,
  options: { completedVariant?: StatusBadgeVariant } = {},
): StatusBadgeVariant => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'completed':
      return options.completedVariant ?? 'success';
    case 'cancelled':
      return 'danger';
    case 'pending_payment':
    case 'preparing':
    case 'ready':
    default:
      return 'warning';
  }
};

export const getOrderActionLabel = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) => {
  if (currentStatus === 'pending_payment' && nextStatus === 'cancelled') {
    return 'Cancel pending order';
  }

  return ORDER_ACTION_LABELS[nextStatus];
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
