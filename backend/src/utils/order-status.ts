import type { OrderStatus } from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

export const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const parseOrderStatus = (status: string): OrderStatus => {
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new ServiceError('Invalid order status', 400);
  }

  return status as OrderStatus;
};

export const assertOrderTransition = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) => {
  if (!allowedOrderTransitions[currentStatus].includes(nextStatus)) {
    throw new ServiceError(
      `Cannot move order from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }
};
