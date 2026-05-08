// selectors/cart-context-selectors.ts

import type { CartContextValue } from '../types/cart';

// =========================
// quantity
// =========================

export const selectTotalQuantity = (ctx: CartContextValue) => ctx.totalQuantity;

// =========================
// quote
// =========================

export const selectQuote = (ctx: CartContextValue) => ctx.quote;

// =========================
// quote status
// =========================

export const selectQuoteStale = (ctx: CartContextValue) => ctx.quoteStale;

export const selectQuoteMismatch = (ctx: CartContextValue) => ctx.quoteMismatch;

// =========================
// price
// =========================

export const selectEstimatedTotalPrice = (ctx: CartContextValue) =>
  ctx.estimatedTotalPrice;

// =========================
// actions
// =========================

export const selectEnsureQuote = (ctx: CartContextValue) => ctx.ensureQuote;

export const selectClearQuote = (ctx: CartContextValue) => ctx.clearQuote;
