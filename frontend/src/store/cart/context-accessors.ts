import type { CartContextValue } from '../../types/cart';

import { selectCartItemQuantity, selectTotalQuantity } from './state-selectors';

export const getTotalQuantity = (ctx: CartContextValue) =>
  selectTotalQuantity(ctx);

export const getCartItemQuantity = (ctx: CartContextValue, id: string) =>
  selectCartItemQuantity(ctx, id);

export const getQuote = (ctx: CartContextValue) => ctx.quote;

export const getQuoteStale = (ctx: CartContextValue) => ctx.quoteStale;

export const getQuoteMismatch = (ctx: CartContextValue) => ctx.quoteMismatch;

export const getEstimatedTotalPrice = (ctx: CartContextValue) =>
  ctx.estimatedTotalCents;

export const getEnsureQuote = (ctx: CartContextValue) => ctx.ensureQuote;

export const getClearQuote = (ctx: CartContextValue) => ctx.clearQuote;
