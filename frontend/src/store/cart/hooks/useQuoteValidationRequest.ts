import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { validateCart } from '../../../api/cart';
import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import type { CartStoredItem, Quote } from '../../../types/cart';
import { buildQuoteKey } from '../utils/quote-key';
import { QuoteRequestInactiveError } from '../utils/quote-request-error';

type InFlightEntry = {
  key: string;
  promise: Promise<QuoteState | null>;
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
}

export const useQuoteValidationRequest = ({
  items,
  itemsSig,
  menuVersion,
  needsQuoteValidation,
  refreshMenuVersion,
  onQuoteValidated,
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

  const validateQuote = useCallback((): Promise<QuoteState | null> => {
    const {
      items: snapshotItems,
      itemsSig: snapshotSig,
      menuVersion: snapshotVersion,
      needsQuoteValidation: snapshotNeedsQuoteValidation,
    } = latestRef.current;

    if (snapshotItems.length === 0) {
      return Promise.resolve(null);
    }

    if (snapshotVersion === null) {
      return Promise.reject(
        new ApiError(HTTP_STATUS.PRECONDITION_REQUIRED, {
          message: 'Menu is still loading. Please wait a moment.',
        }),
      );
    }

    if (!snapshotNeedsQuoteValidation) {
      return Promise.resolve(null);
    }

    const key = buildQuoteKey(snapshotSig, snapshotVersion);
    const activeRequest = inFlightRef.current;

    if (activeRequest?.key === key) {
      return activeRequest.promise;
    }

    activeRequest?.controller.abort();

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const assertRequestActive = () => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        throw new QuoteRequestInactiveError();
      }
    };

    const validateCartSnapshotWithMenuRefresh = async (
      menuVersionToValidate: number,
    ) => {
      try {
        return await validateCart(
          snapshotItems,
          menuVersionToValidate,
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

        const refreshedVersion = await refreshMenuVersion(controller.signal);
        assertRequestActive();

        return validateCart(snapshotItems, refreshedVersion, controller.signal);
      }
    };

    let promise!: Promise<QuoteState | null>;

    promise = (async () => {
      try {
        const res = await validateCartSnapshotWithMenuRefresh(snapshotVersion);
        assertRequestActive();

        if (snapshotSig !== latestRef.current.itemsSig) {
          throw new ApiError(HTTP_STATUS.CONFLICT, {
            message: 'Your cart changed. Please validate it again.',
          });
        }

        const validatedQuote = {
          menuVersion: res.menuVersion,
          menuItems: res.items,
          totalCents: res.totalCents,
          itemsSig: snapshotSig,
          ts: Date.now(),
        };

        onQuoteValidated(validatedQuote);
        return validatedQuote;
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
  }, [onQuoteValidated, refreshMenuVersion]);

  useEffect(() => {
    return cancelQuoteRequest;
  }, [cancelQuoteRequest]);

  return {
    validateQuote,
    cancelQuoteRequest,
  };
};
