import { CartStoredItem } from '../../types/cart';

export const MAX_CART_ITEM_QUANTITY = 20;

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
