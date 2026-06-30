import type { CartStoredItem, Quote } from '../../../types/cart';

export const calculateEstimatedTotalCents = (
  quote: Quote | null,
  items: CartStoredItem[],
) => {
  if (!quote) return 0;

  const quantityById = new Map(items.map((item) => [item.id, item.quantity]));

  return quote.meals.reduce((total, menuItem) => {
    const quantity = quantityById.get(menuItem.id) ?? 0;
    return total + menuItem.priceCents * quantity;
  }, 0);
};
