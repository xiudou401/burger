import type { Dispatch } from 'react';

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

export type CartAction =
  | { type: 'ADD'; meal: Meal }
  | { type: 'REMOVE'; meal: Meal }
  | { type: 'CLEAR' };

export interface CartContextValue extends CartState {
  cartDispatch: Dispatch<CartAction>;
}
