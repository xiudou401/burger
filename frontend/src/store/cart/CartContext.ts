import { createContext } from 'react';
import { CartContextValue } from '../../types/cart';

export const CartContext = createContext<CartContextValue>({
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  cartDispatch: () => {},
});
