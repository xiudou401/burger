import { request } from './request';
import type { CartStoredItem } from '../types/cart';
import type { CancellationReason, Order, OrderStatus } from '../types/order';

export const createCheckoutOrder = (
  items: CartStoredItem[],
  menuVersion: number,
  idempotencyKey: string,
  supersededCheckoutKeys?: string[],
) => {
  return request<{ order: Order; checkoutUrl: string }>('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({
      items,
      menuVersion,
      idempotencyKey,
      ...(supersededCheckoutKeys?.length ? { supersededCheckoutKeys } : {}),
    }),
  });
};

export const fetchMyOrders = (limit = 5) => {
  return request<{ orders: Order[] }>(`/orders/me?limit=${limit}`);
};

export const fetchOrder = (orderId: string) => {
  return request<{ order: Order }>(`/orders/${encodeURIComponent(orderId)}`);
};

export type AdminOrdersView =
  | 'all'
  | 'kitchen'
  | 'awaiting_payment'
  | 'past'
  | 'completed'
  | 'cancelled';

interface FetchAdminOrdersParams {
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
  view?: AdminOrdersView;
}

export const fetchAdminOrders = ({
  search,
  limit = 20,
  cursor,
  signal,
  view,
  from,
  to,
}: FetchAdminOrdersParams = {}) => {
  const query = new URLSearchParams({ limit: String(limit) });

  if (cursor) query.set('cursor', cursor);
  if (view) query.set('view', view);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  if (search) query.set('search', search);

  return request<{ orders: Order[]; nextCursor: string | null }>(
    `/orders/admin/all?${query.toString()}`,
    { signal },
  );
};

export const fetchAdminOrder = (orderId: string) => {
  return request<{ order: Order }>(
    `/orders/admin/${encodeURIComponent(orderId)}`,
  );
};

export const updateOrderStatus = (
  orderId: string,
  status: OrderStatus,
  version: number,
  cancellationReason?: CancellationReason,
) => {
  return request<{ order: Order }>(
    `/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        version,
        ...(cancellationReason ? { cancellationReason } : {}),
      }),
    },
  );
};
