import { useContextSelector } from 'use-context-selector';
import { CartContext } from '../cart-context';
import type { CartContextValue } from '../../../types/cart';

export const useCartSelector = <T>(
  selector: (ctx: CartContextValue) => T,
): T => {
  return useContextSelector(CartContext, (ctx) => {
    if (!ctx) {
      throw new Error('useCartSelector must be used inside a CartProvider');
    }
    return selector(ctx);
  });
};
