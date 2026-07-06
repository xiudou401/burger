import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { validateCart } from '../../../api/cart';
import { HTTP_STATUS } from '../../../api/http-status';
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
        new ApiError(HTTP_STATUS.CONFLICT, {
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

    const assertRequestActive = () => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        throw new ApiError(HTTP_STATUS.REQUEST_CANCELLED, {
          message: 'Quote request was cancelled or replaced',
        });
      }
    };

    const validateSnapshot = async () => {
      try {
        return await validateCart(
          snapshotItems,
          snapshotVersion,
          controller.signal,
        );
      } catch (err: unknown) {
        if (
          controller.signal.aborted ||
          (err instanceof ApiError &&
            err.statusCode === HTTP_STATUS.REQUEST_CANCELLED)
        ) {
          throw err;
        }

        assertRequestActive();

        if (
          !(err instanceof ApiError) ||
          err.statusCode !== HTTP_STATUS.CONFLICT
        ) {
          throw err;
        }

        await refreshMenuVersion(controller.signal);
        assertRequestActive();

        onMenuVersionConflict();
        throw new ApiError(HTTP_STATUS.CONFLICT, {
          message: 'The menu changed. Please validate your cart again.',
        });
      }
    };

    let promise!: Promise<void>;

    promise = (async () => {
      try {
        const res = await validateSnapshot();
        assertRequestActive();

        if (snapshotSig !== latestRef.current.itemsSig) {
          throw new ApiError(HTTP_STATUS.CONFLICT, {
            message: 'Your cart changed. Please validate it again.',
          });
        }

        onQuoteValidated({
          menuVersion: res.menuVersion,
          menuItems: res.items,
          itemsSig: snapshotSig,
          ts: Date.now(),
        });
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

  useEffect(() => {
    return cancelQuoteRequest;
  }, [cancelQuoteRequest]);

  return {
    ensureQuote,
    cancelQuoteRequest,
  };
};
