import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CartStoredItem, QuoteErrorAction } from '../../../types/cart';
import { cartSignature } from '../utils/cart-signature';
import { getQuoteErrorMessage, getRemovedItemId } from '../utils/quote-error';
import {
  calculateEstimatedTotalCents,
  getQuoteUnitPriceChanges,
  type QuoteUnitPriceChange,
} from '../utils/quote-utils';
import { formatCurrency } from '../../../utils/currency';
import { ApiError } from '../../../api/request';
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
const REMOVED_MENU_ITEM_MESSAGE = 'Menu item removed';

const getPriceUpdatedNotice = (priceChanges: QuoteUnitPriceChange[]) => {
  if (priceChanges.length === 0) return null;

  if (priceChanges.length === 1) {
    const [priceChange] = priceChanges;
    return `${priceChange.name} price updated to ${formatCurrency(
      priceChange.priceCents,
    )}. Please review before paying.`;
  }

  const itemNames = priceChanges.map((priceChange) => priceChange.name);
  const visibleNames = itemNames.slice(0, 2).join(', ');
  const suffix = itemNames.length > 2 ? ', and more' : '';

  return `${visibleNames}${suffix} prices changed. Please review before paying.`;
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
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteErrorAction, setQuoteErrorAction] =
    useState<QuoteErrorAction | null>(null);
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);

  const debounceTimerRef = useRef<number | null>(null);
  const lastValidatedQuoteRef = useRef<QuoteState | null>(null);

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
    setQuoteErrorAction(null);
  }, []);

  const handleQuoteValidated = useCallback((validatedQuote: QuoteState) => {
    const priceChangeNotice = getPriceUpdatedNotice(
      getQuoteUnitPriceChanges(lastValidatedQuoteRef.current, validatedQuote),
    );

    if (priceChangeNotice) {
      setQuoteNotice(priceChangeNotice);
    }

    lastValidatedQuoteRef.current = validatedQuote;
    setQuote(validatedQuote);
    setQuoteError(null);
    setQuoteErrorAction(null);
  }, []);

  const setQuoteValidationError = useCallback(
    (error: unknown) => {
      setQuoteError(
        getQuoteErrorMessage(error, lastValidatedQuoteRef.current ?? quote),
      );

      const removedItemId = getRemovedItemId(error);
      setQuoteErrorAction(
        removedItemId
          ? {
              type: 'removeItem',
              itemId: removedItemId,
            }
          : null,
      );
    },
    [quote],
  );

  const { validateQuote, cancelQuoteRequest } = useQuoteValidationRequest({
    items,
    itemsSig,
    menuVersion,
    needsQuoteValidation,
    refreshMenuVersion,
    onQuoteValidated: handleQuoteValidated,
  });

  const ensureQuote = useCallback(async () => {
    setQuoteError(null);

    try {
      await validateQuote();
    } catch (error) {
      if (!isRequestCancelled(error)) {
        setQuoteValidationError(error);
      }
      throw error;
    }
  }, [setQuoteValidationError, validateQuote]);

  const refreshQuoteSilently = useCallback(async () => {
    try {
      await validateQuote();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.body.message === REMOVED_MENU_ITEM_MESSAGE
      ) {
        setQuoteValidationError(error);
        return;
      }

      if (!isExpectedBackgroundError(error)) {
        reportError(error, {
          source: 'quote-engine',
          operation: 'background-validation',
        });
      }
    }
  }, [setQuoteValidationError, validateQuote]);

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
    lastValidatedQuoteRef.current = null;
    setQuoteNotice(null);
    setQuoteErrorAction(null);
  }, [totalQuantity, cancelQuoteRequest, clearDebounceTimer, clearQuote]);

  useEffect(() => {
    if (!shouldDebounceCartValidation) return;

    clearDebounceTimer();

    debounceTimerRef.current = window.setTimeout(() => {
      refreshQuoteSilently();
      debounceTimerRef.current = null;
    }, VALIDATE_DEBOUNCE_MS);

    return clearDebounceTimer;
  }, [
    itemsSig,
    shouldDebounceCartValidation,
    refreshQuoteSilently,
    clearDebounceTimer,
  ]);

  useEffect(() => {
    if (!quoteStale) return;

    clearDebounceTimer();

    refreshQuoteSilently();
  }, [quoteStale, refreshQuoteSilently, clearDebounceTimer]);

  const estimatedTotalCents = useMemo(
    () => calculateEstimatedTotalCents(quote, items),
    [quote, items],
  );

  return {
    quote,
    quoteError,
    quoteErrorAction,
    quoteNotice,
    quoteStale,
    quoteMismatch,
    estimatedTotalCents,
    ensureQuote,
    clearQuote,
  };
};
