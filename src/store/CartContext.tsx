import { createContext } from 'react';
import type { CartContextValue } from '../types/cart';

// 重点：泛型尖括号要紧跟 createContext，不能换行/错位
export const CartContext = createContext<CartContextValue>({
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  cartDispatch: () => {},
});
