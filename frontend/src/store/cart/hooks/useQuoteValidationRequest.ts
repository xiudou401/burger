import { useCallback, useEffect, useRef } from 'react';
import { validateCart } from '../../../api/cart';
import { ApiError } from '../../../api/request';
import type { CartStoredItem, Quote } from '../../../types/cart';
import { buildQuoteKey } from '../utils/quote-key';

type InFlightEntry = {
  key: string;
  promise: Promise<void>;
  controller: AbortController;
};

export type QuoteState = Quote & {
  itemsSig: string;
};

interface UseQuoteValidationRequestParams {
  items: CartStoredItem[];
  itemsSig: string;
  menuVersion: number | null;
  needsQuoteValidation: boolean;
  refreshMenuVersion: (signal?: AbortSignal) => Promise<number>;
  onQuoteValidated: (quote: QuoteState) => void;
  onMenuVersionConflict: () => void;
}

export const useQuoteValidationRequest = ({
  items,
  itemsSig,
  menuVersion,
  needsQuoteValidation,
  refreshMenuVersion,
  onQuoteValidated,
  onMenuVersionConflict,
}: UseQuoteValidationRequestParams) => {
  const requestIdRef = useRef(0);
  const inFlightRef = useRef<InFlightEntry | null>(null);
  const latestRef = useRef({
    items,
    itemsSig,
    menuVersion,
    needsQuoteValidation,
  });

  useEffect(() => {
    latestRef.current = {
      items,
      itemsSig,
      menuVersion,
      needsQuoteValidation,
    };
  }, [items, itemsSig, menuVersion, needsQuoteValidation]);

  const cancelQuoteRequest = useCallback(() => {
    requestIdRef.current += 1;
    inFlightRef.current?.controller.abort();
    inFlightRef.current = null;
  }, []);

  const ensureQuote = useCallback((): Promise<void> => {
    const {
      items: latestItems,
      itemsSig: latestItemsSig,
      menuVersion: latestMenuVersion,
      needsQuoteValidation: latestNeedsQuoteValidation,
    } = latestRef.current;

    if (!latestNeedsQuoteValidation || latestMenuVersion === null) {
      return Promise.resolve();
    }

    const key = buildQuoteKey(latestItemsSig, latestMenuVersion);
    const currentInFlight = inFlightRef.current;

    if (currentInFlight?.key === key) {
      return currentInFlight.promise;
    }

    currentInFlight?.controller.abort();

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

        onQuoteValidated({
          menuVersion: res.menuVersion,
          meals: res.items,
          itemsSig: snapshotSig,
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
          try {
            await refreshMenuVersion(controller.signal);
          } catch (refreshError) {
            if (
              controller.signal.aborted ||
              (refreshError instanceof ApiError &&
                refreshError.statusCode === 499)
            ) {
              return;
            }

            throw refreshError;
          }

          if (controller.signal.aborted) return;
          if (requestId !== requestIdRef.current) return;

          onMenuVersionConflict();
          return;
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
  }, [onMenuVersionConflict, onQuoteValidated, refreshMenuVersion]);

  useEffect(() => cancelQuoteRequest, [cancelQuoteRequest]);

  return {
    ensureQuote,
    cancelQuoteRequest,
  };
};
