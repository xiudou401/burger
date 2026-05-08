import type { CartStoredItem } from '../../../types/cart';

export const cartSignature = (items: CartStoredItem[]) =>
  items
    .map((item) => `${item.id}:${item.quantity}`)
    .sort()
    .join('|');
