import { Dispatch } from 'react';
import { Meal } from './meal';

export interface CartStoredItem {
  id: string;
  quantity: number;
}

export interface CartMeal extends Meal {
  quantity: number;
  subtotal: number;
}

export interface CartState {
  items: CartStoredItem[];
  totalQuantity: number;
}

export interface Quote {
  menuVersion: number;
  meals: CartMeal[];
  ts: number;
}

export const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
} as const;

export type CartAction =
  | { type: typeof CART_ACTIONS.ADD_ITEM; id: string }
  | { type: typeof CART_ACTIONS.REMOVE_ITEM; id: string }
  | { type: typeof CART_ACTIONS.DELETE_ITEM; id: string }
  | { type: typeof CART_ACTIONS.CLEAR_CART };

export interface CartContextValue extends CartState {
  cartDispatch: Dispatch<CartAction>;

  // ✅ pricing layer
  menuVersion: number;
  quote: Quote | null;
  quoteStale: boolean;
  quoteMismatch: boolean;
  estimatedTotalPrice: number;

  ensureQuote: () => Promise<void>;
  clearQuote: () => void;
}
