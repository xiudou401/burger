import { formatCurrency } from '../../../utils/currency';
import type { QuoteUnitPriceChange } from './quote-utils';

export const getPriceUpdatedNotice = (priceChanges: QuoteUnitPriceChange[]) => {
  if (priceChanges.length === 0) return null;

  if (priceChanges.length === 1) {
    const [priceChange] = priceChanges;
    return `${priceChange.name} price updated to ${formatCurrency(
      priceChange.priceCents,
    )}. Please review before paying.`;
  }

  const itemNames = priceChanges.map((priceChange) => priceChange.name);
  const visibleNames = itemNames.slice(0, 2).join(', ');
  const suffix = itemNames.length > 2 ? ', and more' : '';

  return `${visibleNames}${suffix} prices changed. Please review before paying.`;
};
