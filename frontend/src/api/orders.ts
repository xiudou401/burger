import { request } from './request';
import type { CartStoredItem } from '../types/cart';
import type { Order, OrderStatus } from '../types/order';

export const createOrder = (items: CartStoredItem[], menuVersion: number) => {
  return request<{ order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      items,
      menuVersion,
    }),
  });
};

export const createCheckoutOrder = (
  items: CartStoredItem[],
  menuVersion: number,
) => {
  return request<{ order: Order; checkoutUrl: string }>('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      items,
      menuVersion,
    }),
  });
};

export const fetchMyOrders = (limit = 5) => {
  return request<{ orders: Order[] }>(`/orders/me?limit=${limit}`);
};

export const fetchOrder = (orderId: string) => {
  return request<{ order: Order }>(`/orders/${orderId}`);
};

export const fetchAdminOrders = (limit = 25) => {
  return request<{ orders: Order[] }>(`/orders/admin/all?limit=${limit}`);
};

export const fetchAdminOrder = (orderId: string) => {
  return request<{ order: Order }>(`/orders/admin/${orderId}`);
};

export const updateOrderStatus = (orderId: string, status: OrderStatus) => {
  return request<{ order: Order }>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};
