// import { useCallback } from 'react';
import { useCartSelector } from './useCart';
// import {
//   selectCartItemQuantity,
//   selectCartItems,
//   selectCartTotalQuantity,
// } from '../store/cart/cart-selectors';

export const useCartSelectors = () => {
  const items = useCartSelector((ctx) => ctx.items);
  const totalQuantity = useCartSelector((ctx) => ctx.totalQuantity);

  const menuVersion = useCartSelector((ctx) => ctx.menuVersion);
  const quote = useCartSelector((ctx) => ctx.quote);
  const quoteStale = useCartSelector((ctx) => ctx.quoteStale);
  const quoteMismatch = useCartSelector((ctx) => ctx.quoteMismatch);
  const estimatedTotalPrice = useCartSelector((ctx) => ctx.estimatedTotalPrice);

  const ensureQuote = useCartSelector((ctx) => ctx.ensureQuote);
  const clearQuote = useCartSelector((ctx) => ctx.clearQuote);

  return {
    items,
    totalQuantity,

    menuVersion,
    quote,
    quoteStale,
    quoteMismatch,
    estimatedTotalPrice,
    ensureQuote,
    clearQuote,
  };
};
