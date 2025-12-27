import { CartState } from '../../types/cart';

export const selectCartItems = (state: CartState) => state.items;

export const selectCartTotalQuantity = (state: CartState) =>
  state.totalQuantity;

export const selectCartTotalPrice = (state: CartState) => state.totalPrice;

export const selectCartItemQuantity = (state: CartState, id: string) =>
  state.items.find((item) => item.id === id)?.quantity ?? 0;
