import { createContext } from 'react';

export const CartContext = createContext({
  items: [],
  totalPrice: 0,
  totalQuantity: 0,
  cartDispatch: () => {},
});
