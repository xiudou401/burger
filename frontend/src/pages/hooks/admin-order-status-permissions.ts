import type { User } from '../../types/auth';
import type { OrderStatus } from '../../types/order';

export const adminNextStatusesByStatus: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
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

export const getNextStatusesByRole = (role: User['role'] | undefined) =>
  role === 'admin' ? adminNextStatusesByStatus : staffNextStatusesByStatus;
