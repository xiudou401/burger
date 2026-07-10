import type { OrderStatus } from '../models/order.model';
import { ServiceError } from '../errors/ServiceError';

export const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const canTransitionOrderStatus = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) => allowedOrderTransitions[currentStatus].includes(nextStatus);

export const assertCanTransitionOrderStatus = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
) => {
  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    throw new ServiceError(
      `Cannot move order from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }
};
