import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import { CartMenuItem } from '../../../types/cart';
import type { Quote } from '../../../types/cart';
import { getQuoteErrorMessage } from '../../../store/cart/utils/quote-error';

export const calculateTotals = (menuItems: CartMenuItem[]) => {
  const totalQuantity = menuItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCents = menuItems.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  return { totalQuantity, totalCents };
};

const getRequestReference = (error: ApiError) => {
  return error.requestId ? ` Reference: ${error.requestId}` : '';
};

export const getCheckoutErrorMessage = (
  error: unknown,
  quote?: Quote | null,
) => {
  if (error instanceof ApiError) {
    if (error.statusCode === HTTP_STATUS.CONFLICT) {
      return 'Some menu items have changed. Please review your cart before checkout.';
    }

    if (error.statusCode === HTTP_STATUS.FORBIDDEN) {
      return error.message;
    }

    const quoteErrorMessage = getQuoteErrorMessage(error, quote);

    if (error.statusCode >= HTTP_STATUS.SERVER_ERROR_MIN) {
      return `${quoteErrorMessage}${getRequestReference(error)}`;
    }

    return quoteErrorMessage;
  }

  return error instanceof Error ? error.message : 'Could not place order';
};
