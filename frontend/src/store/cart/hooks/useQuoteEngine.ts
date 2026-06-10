import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validateCart } from '../../../api/cart';
import { ApiError } from '../../../api/request';
import type { CartStoredItem, Quote } from '../../../types/cart';
import { cartSignature } from '../utils/cart-signature';
import { buildQuoteKey } from '../utils/quote-key';

const VALIDATE_DEBOUNCE_MS = 300;

type InFlightEntry = {
  key: string;
  promise: Promise<void>;
  controller: AbortController;
};

interface UseQuoteEngineParams {
  items: CartStoredItem[];
  totalQuantity: number;
  menuVersion: number | null;
  refreshMenuVersion: (signal?: AbortSignal) => Promise<number>;
}

export const useQuoteEngine = ({
  items,
  totalQuantity,
  menuVersion,
  refreshMenuVersion,
}: UseQuoteEngineParams) => {
  const [quote, setQuote] = useState<Quote | null>(null);

  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef<InFlightEntry | null>(null);

  const itemsSig = useMemo(() => cartSignature(items), [items]);

  const quoteSig = useMemo(() => {
    if (!quote) return '';
    return cartSignature(quote.meals);
  }, [quote]);

  const quoteMismatch = !!quote && itemsSig !== quoteSig;
  const quoteStale =
    menuVersion !== null && !!quote && quote.menuVersion !== menuVersion;

  const shouldValidate =
    menuVersion !== null &&
    items.length > 0 &&
    (!quote || quoteStale || quoteMismatch);

  const shouldDebounceValidate =
    menuVersion !== null && items.length > 0 && (!quote || quoteMismatch);

  const latestRef = useRef({
    items,
    itemsSig,
    menuVersion,
    shouldValidate,
  });

  useEffect(() => {
    latestRef.current = {
      items,
      itemsSig,
      menuVersion,
      shouldValidate,
    };
  }, [items, itemsSig, menuVersion, shouldValidate]);

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

    if (latestMenuVersion === null) {
      return Promise.resolve();
    }

    const key = buildQuoteKey(latestItemsSig, latestMenuVersion);
    const currentInFlight = inFlightRef.current;

    if (currentInFlight && currentInFlight.key === key) {
      return currentInFlight.promise;
    }

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

        if (requestId !== requestIdRef.current) return;
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
          await refreshMenuVersion(controller.signal);

          if (controller.signal.aborted) return;
          if (requestId !== requestIdRef.current) return;

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
  }, [refreshMenuVersion]);

  const clearQuote = useCallback(() => {
    setQuote(null);
  }, []);

  useEffect(() => {
    if (totalQuantity !== 0) return;

    inFlightRef.current?.controller.abort();
    inFlightRef.current = null;

    setQuote(null);
    clearDebounceTimer();
  }, [totalQuantity, clearDebounceTimer]);

  useEffect(() => {
    if (!shouldDebounceValidate) return;

    clearDebounceTimer();

    debounceTimerRef.current = window.setTimeout(() => {
      ensureQuote().catch(() => {
        // Automatic validation errors are surfaced when the user checks out.
      });
      debounceTimerRef.current = null;
    }, VALIDATE_DEBOUNCE_MS);

    return clearDebounceTimer;
  }, [itemsSig, shouldDebounceValidate, ensureQuote, clearDebounceTimer]);

  useEffect(() => {
    if (!quoteStale) return;

    clearDebounceTimer();

    ensureQuote().catch(() => {
      // Automatic validation errors are surfaced when the user checks out.
    });
  }, [quoteStale, ensureQuote, clearDebounceTimer]);

  const estimatedTotalCents = useMemo(() => {
    if (!quote) return 0;

    const qtyMap = new Map(items.map((item) => [item.id, item.quantity]));

    return quote.meals.reduce((sum, meal) => {
      const quantity = qtyMap.get(meal.id) ?? 0;
      return sum + meal.priceCents * quantity;
    }, 0);
  }, [quote, items]);

  return {
    quote,
    quoteStale,
    quoteMismatch,
    estimatedTotalCents,
    ensureQuote,
    clearQuote,
  };
};
