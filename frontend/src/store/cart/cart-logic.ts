import { MAX_CART_ITEM_QUANTITY } from '@burger/shared';
import { CartStoredItem } from '../../types/cart';

export { MAX_CART_ITEM_QUANTITY };

export const addItem = (items: CartStoredItem[], id: string) => {
  const existing = items.find((i) => i.id === id);
  if (existing) {
    return items.map((i) =>
      i.id === id
        ? {
            ...i,
            quantity: Math.min(i.quantity + 1, MAX_CART_ITEM_QUANTITY),
          }
        : i,
    );
  }
  return [...items, { id, quantity: 1 }];
};

export const removeItem = (items: CartStoredItem[], id: string) => {
  return items
    .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
    .filter((i) => i.quantity > 0);
};

export const deleteItem = (items: CartStoredItem[], id: string) => {
  return items.filter((i) => i.id !== id);
};
