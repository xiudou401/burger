import { useEffect } from 'react';
import type { CartStoredItem } from '../../../types/cart';
import { clearPersistedCart } from '../cart-reducer';
import { useAuth } from '../../auth/hooks/useAuth';
import { readCheckoutAttempt } from '../../../utils/checkout-attempt';

export const useCartPersistence = (items: CartStoredItem[]) => {
  const userId = useAuth((ctx) => ctx.user?.id);
  useEffect(() => {
    if (userId) readCheckoutAttempt(userId, items);
    if (items.length === 0) {
      clearPersistedCart();
      return;
    }

    localStorage.setItem('CartItemsState', JSON.stringify(items));
  }, [items, userId]);
};
