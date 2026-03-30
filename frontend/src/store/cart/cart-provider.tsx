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

// 比较完整 cart：id + quantity
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

  // localStorage：只存 items
  useEffect(() => {
    localStorage.setItem('CartItemsState', JSON.stringify(state.items));
  }, [state.items]);

  // 当前菜单版本（轮询）
  const [menuVersion, setMenuVersion] = useState<number>(0);

  useEffect(() => {
    let timer: number | undefined;

    const tick = async () => {
      try {
        const v = await fetchMenuVersion();
        setMenuVersion((prev) => (prev === v ? prev : v));
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

  // quote（只在 validate 时更新）
  const [quote, setQuote] = useState<Quote | null>(null);

  // 只接受最新请求
  const requestIdRef = useRef(0);

  // debounce timer
  const debounceTimerRef = useRef<number | null>(null);

  // 当前购物车签名：包含 quantity
  const itemsSig = useMemo(() => cartSignature(state.items), [state.items]);

  // quote 也包含 quantity 的前提下，才能做完整比较
  const quoteSig = useMemo(() => {
    if (!quote) return '';
    return cartSignature(quote.meals);
  }, [quote]);

  // quote 和当前 cart 是否不一致（现在会检查数量）
  const quoteMismatch = !!quote && itemsSig !== quoteSig;

  // quote 是否过期
  const quoteStale = !!quote && quote.menuVersion !== menuVersion;

  // 总体是否需要校验
  const needValidate = useMemo(() => {
    return state.items.length > 0 && (!quote || quoteStale || quoteMismatch);
  }, [state.items.length, quote, quoteStale, quoteMismatch]);

  // 只用于“购物车变化”的 debounce 校验
  // 故意不包含 quoteStale，因为菜单变化要立即校验
  const needDebouncedValidate = useMemo(() => {
    return state.items.length > 0 && (!quote || quoteMismatch);
  }, [state.items.length, quote, quoteMismatch]);

  // 用 ref 保存最新值，让 ensureQuote 保持稳定
  const latestRef = useRef({
    items: state.items,
    itemsSig,
    menuVersion,
    needValidate,
  });

  useEffect(() => {
    latestRef.current = {
      items: state.items,
      itemsSig,
      menuVersion,
      needValidate,
    };
  }, [state.items, itemsSig, menuVersion, needValidate]);

  const ensureQuote = useCallback(async () => {
    const {
      items: latestItems,
      itemsSig: latestItemsSig,
      menuVersion: latestMenuVersion,
      needValidate: latestNeedValidate,
    } = latestRef.current;

    if (!latestNeedValidate) return;
    if (latestItems.length === 0) return;

    const requestId = ++requestIdRef.current;

    const snapshotItems = latestItems;
    const snapshotSig = latestItemsSig;
    const snapshotVersion = latestMenuVersion;

    try {
      const res = await validateCart(snapshotItems, snapshotVersion);

      // 只接受最新请求
      if (requestId !== requestIdRef.current) return;

      // 请求回来后，如果 cart 已变，丢弃旧结果
      if (snapshotSig !== latestRef.current.itemsSig) return;

      setQuote({
        menuVersion: res.menuVersion,
        meals: res.items,
        ts: Date.now(),
      });
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return;

      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          try {
            const newVersion = await fetchMenuVersion();

            if (requestId !== requestIdRef.current) return;

            setMenuVersion(newVersion);
            setQuote(null);
          } catch {
            // ignore
          }
          return;
        }

        if (err.statusCode >= 500) {
          console.error('Server error');
        }
      }
    }
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
  }, []);

  // cart 清空 → 清 quote，并清掉 debounce
  useEffect(() => {
    if (state.totalQuantity === 0) {
      setQuote(null);

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [state.totalQuantity]);

  // 购物车变化时：debounce 校验
  useEffect(() => {
    if (!needDebouncedValidate) return;
    if (state.items.length === 0) return;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      ensureQuote();
      debounceTimerRef.current = null;
    }, VALIDATE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [itemsSig, needDebouncedValidate, state.items.length, ensureQuote]);

  // 菜单版本变化导致 quote 过期时：立即校验
  useEffect(() => {
    if (!quoteStale) return;
    if (latestRef.current.items.length === 0) return;

    // 避免和旧的 debounce timer 重叠
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    ensureQuote();
  }, [quoteStale, ensureQuote]);

  const estimatedTotalPrice = useMemo(() => {
    if (!quote) return 0;

    const qtyMap = new Map(state.items.map((i) => [i.id, i.quantity]));

    return quote.meals.reduce((sum, meal) => {
      const q = qtyMap.get(meal.id) ?? 0;
      return sum + meal.price * q;
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
