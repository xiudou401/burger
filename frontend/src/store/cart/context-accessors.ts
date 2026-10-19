import type { CartContextValue } from '../../types/cart';

import { selectCartItemQuantity, selectTotalQuantity } from './state-selectors';

export const getTotalQuantity = (ctx: CartContextValue) =>
  selectTotalQuantity(ctx);

export const getCartItemQuantity = (ctx: CartContextValue, id: string) =>
  selectCartItemQuantity(ctx, id);

export const getQuote = (ctx: CartContextValue) => ctx.quote;

export const getDisplayTotalCents = (ctx: CartContextValue) =>
  ctx.displayTotalCents;

export const getValidateQuoteForUserAction = (ctx: CartContextValue) =>
  ctx.validateQuoteForUserAction;

export const getClearQuote = (ctx: CartContextValue) => ctx.clearQuote;
