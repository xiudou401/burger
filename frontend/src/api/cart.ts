import type { CartStoredItem, CartMeal } from '../types/cart';

export const validateCart = async (
  items: CartStoredItem[],
): Promise<{ menuVersion: string; items: CartMeal[] }> => {
  const res = await fetch('/api/cart/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to validate cart');
  return res.json();
};
