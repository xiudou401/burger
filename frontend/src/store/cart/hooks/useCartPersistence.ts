import { useEffect } from 'react';
import type { CartStoredItem } from '../../../types/cart';

export const useCartPersistence = (items: CartStoredItem[]) => {
  useEffect(() => {
    localStorage.setItem('CartItemsState', JSON.stringify(items));
  }, [items]);
};
