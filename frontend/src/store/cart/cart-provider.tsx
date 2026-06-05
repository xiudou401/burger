import { ReactNode, useMemo, useReducer } from 'react';
import { CartContext } from './cart-context';
import { CartReducer, loadCartState, initialCartState } from './cart-reducer';
import { useCartPersistence } from './hooks/useCartPersistence';
import { useMenuVersion } from './hooks/useMenuVersion';
import { useQuoteEngine } from './hooks/useQuoteEngine';

interface CartContextProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartContextProviderProps) => {
  const [state, cartDispatch] = useReducer(
    CartReducer,
    initialCartState,
    loadCartState,
  );

  useCartPersistence(state.items);

  const { menuVersion, setMenuVersion } = useMenuVersion();

  const {
    quote,
    quoteStale,
    quoteMismatch,
    estimatedTotalCents,
    ensureQuote,
    clearQuote,
  } = useQuoteEngine({
    items: state.items,
    totalQuantity: state.totalQuantity,
    menuVersion,
    setMenuVersion,
  });

  const value = useMemo(
    () => ({
      ...state,
      cartDispatch,
      menuVersion,
      quote,
      quoteStale,
      quoteMismatch,
      estimatedTotalCents,
      ensureQuote,
      clearQuote,
    }),
    [
      state,
      cartDispatch,
      menuVersion,
      quote,
      quoteStale,
      quoteMismatch,
      estimatedTotalCents,
      ensureQuote,
      clearQuote,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
