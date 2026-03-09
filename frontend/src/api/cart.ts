import { request } from './request';
import type { CartStoredItem, CartMeal } from '../types/cart';

export const validateCart = (items: CartStoredItem[]) => {
  return request<{ menuVersion: string; items: CartMeal[] }>('/cart/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
};
