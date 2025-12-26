import {
  selectCartItemQuantity,
  selectCartItems,
  selectCartTotalPrice,
  selectCartTotalQuantity,
} from '../store/cart/cart.selectors';
import { useCartContext } from './useCart';

export const useCartSelectors = () => {
  const state = useCartContext();
  return {
    items: selectCartItems(state),
    totalPrice: selectCartTotalPrice(state),
    totalQuantity: selectCartTotalQuantity(state),
    getItemQuantity: (_id: string) => {
      return selectCartItemQuantity(state, _id);
    },
  };
};
