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
