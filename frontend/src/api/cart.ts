import { request } from './request';
import type { CartStoredItem, CartMenuItem } from '../types/cart';

export const validateCart = (
  items: CartStoredItem[],
  menuVersion: number,
  signal?: AbortSignal,
) => {
  return request<{
    menuVersion: number;
    items: CartMenuItem[];
    totalCents: number;
  }>('/cart/validate', {
    method: 'POST',
    body: JSON.stringify({
      items,
      menuVersion,
    }),
    signal,
  });
};
