import type { CartState } from '../../types/cart';

export const selectCartItems = (state: CartState) => state.items;

export const selectTotalQuantity = (state: CartState) => state.totalQuantity;

export const selectCartItemQuantity = (state: CartState, id: string) =>
  state.items.find((i) => i.id === id)?.quantity ?? 0;
