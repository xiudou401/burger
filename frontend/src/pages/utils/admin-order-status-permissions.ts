import type { User } from '../../types/auth';
import type { OrderStatus } from '../../types/order';
import { hasPermission } from '../../types/permissions';

export const adminNextStatusesByStatus: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const staffNextStatusesByStatus: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  paid: ['preparing'],
  preparing: ['ready'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export const getNextStatusesByUser = (user: User | null | undefined) =>
  hasPermission(user, 'manage_orders')
    ? adminNextStatusesByStatus
    : staffNextStatusesByStatus;
