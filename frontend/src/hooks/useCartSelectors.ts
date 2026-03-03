import { useCallback } from 'react';
import { useCartContext } from './useCart';
import {
  selectCartItemQuantity,
  selectCartItems,
  selectCartTotalQuantity,
} from '../store/cart/cart-selectors';

export const useCartSelectors = () => {
  const ctx = useCartContext();

  const getItemQuantity = useCallback(
    (id: string) => selectCartItemQuantity(ctx, id),
    [ctx],
  );

  return {
    items: selectCartItems(ctx),
    totalQuantity: selectCartTotalQuantity(ctx),
    getItemQuantity,

    // ✅ pricing layer
    menuVersion: ctx.menuVersion,
    quote: ctx.quote,
    quoteStale: ctx.quoteStale,
    quoteMismatch: ctx.quoteMismatch,
    estimatedTotalPrice: ctx.estimatedTotalPrice,
    ensureQuote: ctx.ensureQuote,
    clearQuote: ctx.clearQuote,
  };
};
