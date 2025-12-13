import { Dispatch } from 'react';

export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface CartItem extends Meal {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

export const Cart_Actions = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
} as const;

export type CartAction =
  | { type: typeof Cart_Actions.ADD; meal: Meal }
  | { type: typeof Cart_Actions.REMOVE; meal: Meal }
  | { type: typeof Cart_Actions.CLEAR };

export interface CartContextValue extends CartState {
  cartDispatch: Dispatch<CartAction>;
}
