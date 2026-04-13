import {
  ReactNode,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useCallback,
} from 'react';
import { CartContext } from './cart-context';
import { CartReducer, loadCartState, initialCartState } from './cart-reducer';
import type { Quote } from '../../types/cart';
import { validateCart } from '../../api/cart';
import { fetchMenuVersion } from '../../api/menuVersion';
import { ApiError } from '../../api/request';

const MENU_POLL_MS = 30_000;
const VALIDATE_DEBOUNCE_MS = 300;

interface CartContextProviderProps {
  children: ReactNode;
}

const cartSignature = (arr: { id: string; quantity: number }[]) =>
  arr
    .map((x) => `${x.id}:${x.quantity}`)
    .sort()
    .join('|');

export const CartProvider = ({ children }: CartContextProviderProps) => {
  const [state, cartDispatch] = useReducer(
    CartReducer,
    initialCartState,
    loadCartState,
  );

  const [menuVersion, setMenuVersion] = useState<number>(0);
  const [quote, setQuote] = useState<Quote | null>(null);

  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    localStorage.setItem('CartItemsState', JSON.stringify(state.items));
  }, [state.items]);

  useEffect(() => {
    let timer: number | undefined;

    const tick = async () => {
      try {
        const version = await fetchMenuVersion();
        setMenuVersion((prev) => (prev === version ? prev : version));
      } catch {
        // ignore
      } finally {
        timer = window.setTimeout(tick, MENU_POLL_MS);
      }
    };

    tick();

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const itemsSig = useMemo(() => cartSignature(state.items), [state.items]);

  const quoteSig = useMemo(() => {
    if (!quote) return '';
    return cartSignature(quote.meals);
  }, [quote]);

  const quoteMismatch = !!quote && itemsSig !== quoteSig;
  const quoteStale = !!quote && quote.menuVersion !== menuVersion;

  const shouldValidate =
    state.items.length > 0 && (!quote || quoteStale || quoteMismatch);

  const shouldDebounceValidate =
    state.items.length > 0 && (!quote || quoteMismatch);

  const latestRef = useRef({
    items: state.items,
    itemsSig,
    menuVersion,
    shouldValidate,
  });

  useEffect(() => {
    latestRef.current = {
      items: state.items,
      itemsSig,
      menuVersion,
      shouldValidate,
    };
  }, [state.items, itemsSig, menuVersion, shouldValidate]);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const ensureQuote = useCallback((): Promise<void> => {
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const promise = (async () => {
      const {
        items: latestItems,
        itemsSig: latestItemsSig,
        menuVersion: latestMenuVersion,
        shouldValidate: latestShouldValidate,
      } = latestRef.current;

      if (!latestShouldValidate) return;

      const requestId = ++requestIdRef.current;
      const snapshotItems = latestItems;
      const snapshotSig = latestItemsSig;
      const snapshotVersion = latestMenuVersion;

      try {
        const res = await validateCart(snapshotItems, snapshotVersion);

        if (requestId !== requestIdRef.current) return;
        if (snapshotSig !== latestRef.current.itemsSig) return;

        setQuote({
          menuVersion: res.menuVersion,
          meals: res.items,
          ts: Date.now(),
        });
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return;

        if (!(err instanceof ApiError)) {
          throw err;
        }

        if (err.statusCode === 409) {
          const newVersion = await fetchMenuVersion();

          if (requestId !== requestIdRef.current) return;

          setMenuVersion(newVersion);
          setQuote(null);
          return;
        }

        if (err.statusCode >= 500) {
          console.error('Server error');
        }

        throw err;
      }
    })();

    inFlightPromiseRef.current = promise;

    promise.finally(() => {
      if (inFlightPromiseRef.current === promise) {
        inFlightPromiseRef.current = null;
      }
    });

    return promise;
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
  }, []);

  useEffect(() => {
    if (state.totalQuantity !== 0) return;

    setQuote(null);
    clearDebounceTimer();
  }, [state.totalQuantity, clearDebounceTimer]);

  useEffect(() => {
    if (!shouldDebounceValidate) return;

    clearDebounceTimer();

    debounceTimerRef.current = window.setTimeout(() => {
      ensureQuote().catch(() => {
        // 自动校验失败：这里先吞掉，避免未处理 Promise
      });
      debounceTimerRef.current = null;
    }, VALIDATE_DEBOUNCE_MS);

    return clearDebounceTimer;
  }, [itemsSig, shouldDebounceValidate, ensureQuote, clearDebounceTimer]);

  useEffect(() => {
    if (!quoteStale) return;

    clearDebounceTimer();

    ensureQuote().catch(() => {
      // 自动校验失败：先吞掉
    });
  }, [quoteStale, ensureQuote, clearDebounceTimer]);

  const estimatedTotalPrice = useMemo(() => {
    if (!quote) return 0;

    const qtyMap = new Map(state.items.map((item) => [item.id, item.quantity]));

    return quote.meals.reduce((sum, meal) => {
      const quantity = qtyMap.get(meal.id) ?? 0;
      return sum + meal.price * quantity;
    }, 0);
  }, [quote, state.items]);

  return (
    <CartContext.Provider
      value={{
        ...state,
        cartDispatch,
        menuVersion,
        quote,
        quoteStale,
        quoteMismatch,
        estimatedTotalPrice,
        ensureQuote,
        clearQuote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
