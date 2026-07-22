import type { CartStoredItem, Quote } from '../../../types/cart';

export const calculateEstimatedTotalCents = (
  quote: Quote | null,
  items: CartStoredItem[],
) => {
  if (!quote) return 0;

  const quantityById = new Map(items.map((item) => [item.id, item.quantity]));

  return quote.menuItems.reduce((total, menuItem) => {
    const quantity = quantityById.get(menuItem.id) ?? 0;
    return total + menuItem.priceCents * quantity;
  }, 0);
};

export const hasQuoteUnitPriceChanged = (
  previousQuote: Quote | null,
  nextQuote: Quote,
) => {
  if (!previousQuote) return false;

  const previousPriceById = new Map(
    previousQuote.menuItems.map((menuItem) => [
      menuItem.id,
      menuItem.priceCents,
    ]),
  );

  return nextQuote.menuItems.some((menuItem) => {
    const previousPrice = previousPriceById.get(menuItem.id);
    return previousPrice !== undefined && previousPrice !== menuItem.priceCents;
  });
};
