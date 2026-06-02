import { useEffect } from 'react';
import type { CartStoredItem } from '../../../types/cart';
import { cartSignature } from '../utils/cart-signature';

export const useCartPersistence = (items: CartStoredItem[]) => {
  const itemsSignature = cartSignature(items);

  useEffect(() => {
    localStorage.setItem('CartItemsState', JSON.stringify(items));
  }, [items, itemsSignature]);
};
