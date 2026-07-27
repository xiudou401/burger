import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import type { Quote, QuoteErrorAction } from '../../../types/cart';

export const getRemovedItemId = (error: unknown) => {
  if (!(error instanceof ApiError)) return null;
  if (error.body.message !== 'Menu item removed') return null;

  const itemId = error.body.details?.itemId;

  return typeof itemId === 'string' ? itemId : null;
};

const getRemovedItemName = (itemId: string | null, quote?: Quote | null) => {
  if (!itemId) return null;

  return quote?.menuItems.find((menuItem) => menuItem.id === itemId)?.name;
};

const getRemovedItemMessage = (itemId: string | null, quote?: Quote | null) => {
  const itemName = getRemovedItemName(itemId, quote);

  if (itemName) {
    return `${itemName} is no longer available. Please remove it from your cart.`;
  }

  return 'An item in your cart is no longer available. Please review your cart.';
};

export const getQuoteErrorMessage = (error: unknown, quote?: Quote | null) => {
  if (error instanceof ApiError && error.statusCode === HTTP_STATUS.CONFLICT) {
    return 'Some menu items have changed. Please review your cart before checkout.';
  }

  if (error instanceof ApiError && error.body.message === 'Menu item removed') {
    return getRemovedItemMessage(getRemovedItemId(error), quote);
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

export const getQuoteErrorState = (
  error: unknown,
  quote?: Quote | null,
): {
  message: string;
  action: QuoteErrorAction | null;
} => {
  const removedItemId = getRemovedItemId(error);
  const isRemovedItemError =
    error instanceof ApiError && error.body.message === 'Menu item removed';

  if (isRemovedItemError) {
    return {
      message: getRemovedItemMessage(removedItemId, quote),
      action: removedItemId
        ? {
            type: 'removeItem',
            itemId: removedItemId,
          }
        : null,
    };
  }

  return {
    message: getQuoteErrorMessage(error, quote),
    action: null,
  };
};
