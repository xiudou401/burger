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

const buildQuoteKey = (itemsSig: string, menuVersion: number) =>
  `${itemsSig}::${menuVersion}`;

type InFlightEntry = {
  key: string;
  promise: Promise<void>;
  controller: AbortController;
};

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
  const inFlightRef = useRef<InFlightEntry | null>(null);

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
    const {
      items: latestItems,
      itemsSig: latestItemsSig,
      menuVersion: latestMenuVersion,
      shouldValidate: latestShouldValidate,
    } = latestRef.current;

    if (!latestShouldValidate) {
      return Promise.resolve();
    }

    const key = buildQuoteKey(latestItemsSig, latestMenuVersion);
    const currentInFlight = inFlightRef.current;

    // 1) same-key: 复用当前正在飞的请求
    if (currentInFlight && currentInFlight.key === key) {
      return currentInFlight.promise;
    }

    // 2) different-key: 当前飞的请求已经不是我们要的那份 quote，取消它
    if (currentInFlight) {
      currentInFlight.controller.abort();
      inFlightRef.current = null;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const snapshotItems = latestItems;
    const snapshotSig = latestItemsSig;
    const snapshotVersion = latestMenuVersion;

    let promise!: Promise<void>;

    promise = (async () => {
      try {
        const res = await validateCart(
          snapshotItems,
          snapshotVersion,
          controller.signal,
        );

        // latest-wins：不是最新请求，直接丢弃
        if (requestId !== requestIdRef.current) return;

        // 请求回来时，购物车内容已经变了，也丢弃
        if (snapshotSig !== latestRef.current.itemsSig) return;

        setQuote({
          menuVersion: res.menuVersion,
          meals: res.items,
          ts: Date.now(),
        });
      } catch (err: unknown) {
        if (
          controller.signal.aborted ||
          (err instanceof ApiError && err.statusCode === 499)
        ) {
          return;
        }

        if (requestId !== requestIdRef.current) return;

        if (!(err instanceof ApiError)) {
          throw err;
        }

        if (err.statusCode === 409) {
          const newVersion = await fetchMenuVersion();

          if (controller.signal.aborted) return;
          if (requestId !== requestIdRef.current) return;

          setMenuVersion(newVersion);
          setQuote(null);
          return;
        }

        if (err.statusCode >= 500) {
          console.error('Server error');
        }

        throw err;
      } finally {
        if (inFlightRef.current?.promise === promise) {
          inFlightRef.current = null;
        }
      }
    })();

    inFlightRef.current = {
      key,
      promise,
      controller,
    };

    return promise;
  }, []);

  const clearQuote = useCallback(() => {
    // 如果你希望手动 clearQuote 时，也顺便取消当前 quote 请求，可以打开下面两行
    // inFlightRef.current?.controller.abort();
    // inFlightRef.current = null;

    setQuote(null);
  }, []);

  useEffect(() => {
    if (state.totalQuantity !== 0) return;

    inFlightRef.current?.controller.abort();
    inFlightRef.current = null;

    setQuote(null);
    clearDebounceTimer();
  }, [state.totalQuantity, clearDebounceTimer]);

  useEffect(() => {
    if (!shouldDebounceValidate) return;

    clearDebounceTimer();

    debounceTimerRef.current = window.setTimeout(() => {
      ensureQuote().catch(() => {
        // 自动校验失败：先吞掉，避免未处理 Promise
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
