import { Dispatch } from 'react';

export interface Meal {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface CartMeal extends Meal {
  quantity: number;
}

export interface CartState {
  items: CartMeal[];
  totalQuantity: number;
  totalPrice: number;
}

export const CART_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
} as const;

export type CartAction =
  | { type: typeof CART_ACTIONS.ADD; meal: Meal }
  | { type: typeof CART_ACTIONS.REMOVE; meal: Meal }
  | { type: typeof CART_ACTIONS.CLEAR };

export interface CartContextValue extends CartState {
  cartDispatch: Dispatch<CartAction>;
}
