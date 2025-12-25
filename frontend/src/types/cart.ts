import { Dispatch } from 'react';
import { Meal } from './meal';

export interface CartMeal extends Meal {
  quantity: number;
}

export interface CartState {
  items: CartMeal[];
  totalQuantity: number;
  totalPrice: number;
}

export const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
} as const;

export type CartAction =
  | { type: typeof CART_ACTIONS.ADD_ITEM; meal: Meal }
  | { type: typeof CART_ACTIONS.REMOVE_ITEM; _id: string }
  | { type: typeof CART_ACTIONS.DELETE_ITEM; _id: string }
  | { type: typeof CART_ACTIONS.CLEAR_CART };

export interface CartContextValue extends CartState {
  cartDispatch: Dispatch<CartAction>;
}
