import { useCallback } from 'react';
import {
  selectCartItemQuantity,
  selectCartItems,
  selectCartTotalPrice,
  selectCartTotalQuantity,
} from '../store/cart/cart-selectors';
import { useCartContext } from './useCart';

export const useCartSelectors = () => {
  const state = useCartContext();

  const getItemQuantity = useCallback(
    (id: string) => selectCartItemQuantity(state, id),
    [state]
  );

  return {
    items: selectCartItems(state),
    totalPrice: selectCartTotalPrice(state),
    totalQuantity: selectCartTotalQuantity(state),
    getItemQuantity,
  };
};
