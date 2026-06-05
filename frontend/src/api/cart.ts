import { request } from './request';
import type { CartStoredItem, CartMeal } from '../types/cart';

export const validateCart = (
  items: CartStoredItem[],
  menuVersion: number,
  signal?: AbortSignal,
) => {
  return request<{
    menuVersion: number;
    items: CartMeal[];
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
