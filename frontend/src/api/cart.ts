import { request } from './request';
import type { CartStoredItem, CartMeal } from '../types/cart';

export const validateCart = (items: CartStoredItem[], menuVersion: number) => {
  return request<{
    menuVersion: number;
    items: CartMeal[];
    total: number;
  }>('/cart/validate', {
    method: 'POST',
    body: JSON.stringify({ items, menuVersion }),
  });
};
