import type { Dispatch } from 'react';
import type { MenuItem } from './menu-item';

export interface CartStoredItem {
  id: string;
  quantity: number;
}

export interface CartMenuItem extends MenuItem {
  quantity: number;
  subtotalCents: number;
}

export interface CartState {
  items: CartStoredItem[];
  totalQuantity: number;
}

export interface Quote {
  menuVersion: number;
  menuItems: CartMenuItem[];
  ts: number;
}

export type QuoteErrorAction = {
  type: 'removeItem';
  itemId: string;
};

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

  menuVersion: number | null;
  quote: Quote | null;
  quoteError: string | null;
  quoteErrorAction: QuoteErrorAction | null;
  quoteNotice: string | null;
  quoteStale: boolean;
  quoteMismatch: boolean;
  estimatedTotalCents: number;

  ensureQuote: () => Promise<void>;
  clearQuote: () => void;
}
