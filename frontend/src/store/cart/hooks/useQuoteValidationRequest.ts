import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { validateCart } from '../../../api/cart';
import { API_STATUS } from '../../../api/api-status';
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

  useLayoutEffect(() => {
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

    if (latestItems.length === 0) {
      return Promise.resolve();
    }

    if (latestMenuVersion === null) {
      return Promise.reject(
        new ApiError(API_STATUS.CONFLICT, {
          message: 'The menu is still loading. Please try again.',
        }),
      );
    }

    if (!latestNeedsQuoteValidation) {
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

        if (requestId !== requestIdRef.current) {
          throw new ApiError(API_STATUS.REQUEST_CANCELLED, {
            message: 'Quote request was replaced',
          });
        }

        if (snapshotSig !== latestRef.current.itemsSig) {
          throw new ApiError(API_STATUS.CONFLICT, {
            message: 'Your cart changed. Please validate it again.',
          });
        }

        onQuoteValidated({
          menuVersion: res.menuVersion,
          meals: res.items,
          itemsSig: snapshotSig,
          ts: Date.now(),
        });
      } catch (err: unknown) {
        if (
          controller.signal.aborted ||
          (err instanceof ApiError &&
            err.statusCode === API_STATUS.REQUEST_CANCELLED)
        ) {
          throw err;
        }

        if (requestId !== requestIdRef.current) {
          throw new ApiError(API_STATUS.REQUEST_CANCELLED, {
            message: 'Quote request was replaced',
          });
        }

        if (!(err instanceof ApiError)) {
          throw err;
        }

        if (err.statusCode === API_STATUS.CONFLICT) {
          await refreshMenuVersion(controller.signal);

          if (controller.signal.aborted) {
            throw new ApiError(API_STATUS.REQUEST_CANCELLED, {
              message: 'Quote request was cancelled',
            });
          }

          if (requestId !== requestIdRef.current) {
            throw new ApiError(API_STATUS.REQUEST_CANCELLED, {
              message: 'Quote request was replaced',
            });
          }

          onMenuVersionConflict();
          throw new ApiError(API_STATUS.CONFLICT, {
            message: 'The menu changed. Please validate your cart again.',
          });
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
