import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CartStoredItem } from '../../../types/cart';
import { cartSignature } from '../utils/cart-signature';
import { getQuoteErrorMessage } from '../utils/quote-error';
import { calculateEstimatedTotalCents } from '../utils/quote-utils';
import {
  isExpectedBackgroundError,
  isRequestCancelled,
  reportError,
} from '../../../utils/error-monitoring';
import {
  useQuoteValidationRequest,
  type QuoteState,
} from './useQuoteValidationRequest';

const VALIDATE_DEBOUNCE_MS = 300;

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
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const debounceTimerRef = useRef<number | null>(null);

  const itemsSig = useMemo(() => cartSignature(items), [items]);

  const quoteMismatch = !!quote && itemsSig !== quote.itemsSig;
  const quoteStale =
    menuVersion !== null && !!quote && quote.menuVersion !== menuVersion;

  const needsQuoteValidation =
    menuVersion !== null &&
    items.length > 0 &&
    (!quote || quoteStale || quoteMismatch);

  const shouldDebounceCartValidation =
    menuVersion !== null &&
    items.length > 0 &&
    !quoteStale &&
    (!quote || quoteMismatch);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setQuoteError(null);
  }, []);

  const handleQuoteValidated = useCallback((validatedQuote: QuoteState) => {
    setQuote(validatedQuote);
    setQuoteError(null);
  }, []);

  const { ensureQuote: requestQuote, cancelQuoteRequest } =
    useQuoteValidationRequest({
      items,
      itemsSig,
      menuVersion,
      needsQuoteValidation,
      refreshMenuVersion,
      onQuoteValidated: handleQuoteValidated,
      onMenuVersionConflict: clearQuote,
    });

  const ensureQuote = useCallback(async () => {
    setQuoteError(null);

    try {
      await requestQuote();
    } catch (error) {
      if (!isRequestCancelled(error)) {
        setQuoteError(getQuoteErrorMessage(error));
      }
      throw error;
    }
  }, [requestQuote]);

  const validateQuoteSilently = useCallback(async () => {
    try {
      await requestQuote();
    } catch (error) {
      if (!isExpectedBackgroundError(error)) {
        reportError(error, {
          source: 'quote-engine',
          operation: 'background-validation',
        });
      }
    }
  }, [requestQuote]);

  useEffect(() => {
    return clearDebounceTimer;
  }, [clearDebounceTimer]);

  useEffect(() => {
    setQuoteError(null);
  }, [itemsSig]);

  useEffect(() => {
    if (totalQuantity !== 0) return;

    cancelQuoteRequest();
    clearQuote();
    clearDebounceTimer();
  }, [totalQuantity, cancelQuoteRequest, clearDebounceTimer, clearQuote]);

  useEffect(() => {
    if (!shouldDebounceCartValidation) return;

    clearDebounceTimer();

    debounceTimerRef.current = window.setTimeout(() => {
      validateQuoteSilently();
      debounceTimerRef.current = null;
    }, VALIDATE_DEBOUNCE_MS);

    return clearDebounceTimer;
  }, [
    itemsSig,
    shouldDebounceCartValidation,
    validateQuoteSilently,
    clearDebounceTimer,
  ]);

  useEffect(() => {
    if (!quoteStale) return;

    clearDebounceTimer();

    validateQuoteSilently();
  }, [quoteStale, validateQuoteSilently, clearDebounceTimer]);

  const estimatedTotalCents = useMemo(
    () => calculateEstimatedTotalCents(quote, items),
    [quote, items],
  );

  return {
    quote,
    quoteError,
    quoteStale,
    quoteMismatch,
    estimatedTotalCents,
    ensureQuote,
    clearQuote,
  };
};
