import { useEffect } from 'react';
import type { CartStoredItem } from '../../../types/cart';
import { clearPersistedCart } from '../cart-reducer';

export const useCartPersistence = (items: CartStoredItem[]) => {
  useEffect(() => {
    if (items.length === 0) {
      clearPersistedCart();
      return;
    }

    localStorage.setItem('CartItemsState', JSON.stringify(items));
  }, [items]);
};
