import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import type { Quote } from '../../../types/cart';

const getRemovedItemName = (error: ApiError, quote?: Quote | null) => {
  const itemId = error.body.details?.itemId;

  if (typeof itemId !== 'string') return null;

  return quote?.menuItems.find((menuItem) => menuItem.id === itemId)?.name;
};

export const getQuoteErrorMessage = (error: unknown, quote?: Quote | null) => {
  if (error instanceof ApiError && error.statusCode === HTTP_STATUS.CONFLICT) {
    return 'Some menu items have changed. Please review your cart before checkout.';
  }

  if (error instanceof ApiError && error.body.message === 'Menu item removed') {
    const itemName = getRemovedItemName(error, quote);

    if (itemName) {
      return `${itemName} is no longer available. Please remove it from your cart.`;
    }

    return 'An item in your cart is no longer available. Please review your cart.';
  }

  if (
    error instanceof ApiError &&
    (error.statusCode === HTTP_STATUS.NETWORK_ERROR ||
      error.statusCode === HTTP_STATUS.REQUEST_TIMEOUT ||
      error.statusCode >= HTTP_STATUS.SERVER_ERROR_MIN)
  ) {
    return 'The server is temporarily unavailable. Please try again.';
  }

  return 'Could not validate your cart. Please try again.';
};
