import { useEffect, useRef } from 'react';
import type { CartStoredItem } from '../../../types/cart';
import { cartSignature } from '../utils/cart-signature';

export const useCartPersistence = (items: CartStoredItem[]) => {
  const latestItemsRef = useRef(items);
  const itemsSignature = cartSignature(items);

  latestItemsRef.current = items;

  useEffect(() => {
    localStorage.setItem(
      'CartItemsState',
      JSON.stringify(latestItemsRef.current),
    );
  }, [itemsSignature]);
};
