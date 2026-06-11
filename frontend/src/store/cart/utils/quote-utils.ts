import type { CartStoredItem, Quote } from '../../../types/cart';

export const calculateEstimatedTotalCents = (
  quote: Quote | null,
  items: CartStoredItem[],
) => {
  if (!quote) return 0;

  const quantityById = new Map(items.map((item) => [item.id, item.quantity]));

  return quote.meals.reduce((total, meal) => {
    const quantity = quantityById.get(meal.id) ?? 0;
    return total + meal.priceCents * quantity;
  }, 0);
};
