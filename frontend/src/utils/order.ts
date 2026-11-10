import type { Order, OrderStatus } from '../types/order';

export const getAdminOrderPaymentNotice = (order: Order, now = Date.now()) => {
  if (order.cancellationReason === 'archived_test_checkout')
    return 'Archived test checkout - no real charge';
  if (order.payment?.reviewReason === 'stripe_paid_charge_unverified')
    return 'Stripe reports payment - charge verification pending';
  if (order.payment?.requiresReview)
    return 'Stripe recorded a payment - review before taking action';
  if (order.status === 'cancelled' && order.payment?.status === 'paid')
    return 'Paid - arrange refund separately';
  if (
    order.status === 'pending_payment' &&
    now - Date.parse(order.createdAt) >= 15 * 60 * 1000 &&
    !/^cs_(test|live)_/.test(order.payment?.providerPaymentId ?? '')
  )
    return 'Stripe checkout not found - review payment';
  return null;
};

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
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ORDER_ACTION_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Mark pending',
  confirmed: 'Confirm order',
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
    case 'confirmed':
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
