import { request } from './request';
import type { CartStoredItem } from '../types/cart';
import type { Order, OrderStatus } from '../types/order';

export const createCheckoutOrder = (
  items: CartStoredItem[],
  menuVersion: number,
  idempotencyKey: string,
) => {
  return request<{ order: Order; checkoutUrl: string }>('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      items,
      menuVersion,
      idempotencyKey,
    }),
  });
};

export const fetchMyOrders = (limit = 5) => {
  return request<{ orders: Order[] }>(`/orders/me?limit=${limit}`);
};

export const fetchOrder = (orderId: string) => {
  return request<{ order: Order }>(`/orders/${orderId}`);
};

interface FetchAdminOrdersParams {
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
}

export const fetchAdminOrders = ({
  limit = 20,
  cursor,
  signal,
}: FetchAdminOrdersParams = {}) => {
  const query = new URLSearchParams({ limit: String(limit) });

  if (cursor) query.set('cursor', cursor);

  return request<{ orders: Order[]; nextCursor: string | null }>(
    `/orders/admin/all?${query.toString()}`,
    { signal },
  );
};

export const fetchAdminOrder = (orderId: string) => {
  return request<{ order: Order }>(`/orders/admin/${orderId}`);
};

export const updateOrderStatus = (
  orderId: string,
  status: OrderStatus,
  version: number,
) => {
  return request<{ order: Order }>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, version }),
  });
};
