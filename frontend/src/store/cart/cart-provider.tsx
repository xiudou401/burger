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
import { fetchMenuVersion } from '../../api/menu';

const MENU_POLL_MS = 30_000;

interface CartContextProviderProps {
  children: ReactNode;
}

// ✅ 用 id 集合签名判断：quote 里包含的 meals 是否覆盖当前 cart items
const idsSignature = (arr: { id: string }[]) =>
  arr
    .map((x) => x.id)
    .sort()
    .join('|');

export const CartProvider = ({ children }: CartContextProviderProps) => {
  const [state, cartDispatch] = useReducer(
    CartReducer,
    initialCartState,
    loadCartState,
  );

  // ✅ localStorage：只存 items
  useEffect(() => {
    localStorage.setItem('CartItemsState', JSON.stringify(state.items));
  }, [state.items]);

  // ✅ 当前菜单版本（轮询）
  const [menuVersion, setMenuVersion] = useState<string>('0');

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
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // ✅ quote（只在 validate 时更新）
  const [quote, setQuote] = useState<Quote | null>(null);

  // ✅ 去重锁：避免并发 validate
  const validatingRef = useRef(false);

  // ✅ 更准确的 mismatch：比较 id 集合（不是只比 length）
  const itemsSig = useMemo(() => idsSignature(state.items), [state.items]);
  const quoteSig = useMemo(() => idsSignature(quote?.meals ?? []), [quote]);
  const quoteMismatch = !!quote && itemsSig !== quoteSig;
  const quoteStale = !quote || quote.menuVersion !== menuVersion;

  // ✅ 确保 quote 最新：menuVersion 变了 或 items 集合变了（新增/删除 id）都要校验
  const ensureQuote = useCallback(async () => {
    if (state.items.length === 0) return;

    const needValidate = !quote || quoteStale || quoteMismatch;
    console.log(quoteMismatch);
    console.log('itemsSig', itemsSig);
    console.log('quoteSig', quoteSig);
    if (!needValidate) return;

    if (validatingRef.current) return;
    validatingRef.current = true;

    try {
      const res = await validateCart(state.items);
      setQuote({
        menuVersion: res.menuVersion,
        meals: res.items,
        ts: Date.now(),
      });
      console.log('quote', quote);
    } finally {
      validatingRef.current = false;
    }
  }, [state.items, quote, quoteStale, quoteMismatch]);

  // ✅ 防抖：狂点 +/- 时只触发一次 validate
  useEffect(() => {
    if (state.items.length === 0) return;

    const needValidate = !quote || quoteStale || quoteMismatch;
    if (!needValidate) return;

    const t = window.setTimeout(() => {
      ensureQuote();
    }, 150);

    return () => window.clearTimeout(t);
  }, [state.items, quote, quoteStale, quoteMismatch, ensureQuote]);

  const clearQuote = useCallback(() => setQuote(null), []);

  // ✅ cart 清空 → 清 quote
  useEffect(() => {
    if (state.totalQuantity === 0) {
      setQuote(null);
    }
  }, [state.totalQuantity]);

  // ✅ 估算总价 = quote.price * 实时 quantity（来自 state.items）
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
