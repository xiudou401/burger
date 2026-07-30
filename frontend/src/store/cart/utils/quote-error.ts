import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import type { Quote, QuoteErrorAction } from '../../../types/cart';

const VALIDATION_ERROR_TYPE = 'ValidationError';
const MENU_ITEM_REMOVED_CODE = 'MENU_ITEM_REMOVED';

const isValidationError = (error: unknown) =>
  error instanceof ApiError && error.body.type === VALIDATION_ERROR_TYPE;

export const isRemovedItemError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  error.body.details?.code === MENU_ITEM_REMOVED_CODE;

export const getRemovedItemId = (error: unknown) => {
  if (!isRemovedItemError(error)) return null;

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

  if (
    error instanceof ApiError &&
    error.statusCode === HTTP_STATUS.PRECONDITION_REQUIRED
  ) {
    return 'Menu is still loading. Please wait a moment.';
  }

  if (isRemovedItemError(error)) {
    return getRemovedItemMessage(getRemovedItemId(error), quote);
  }

  if (isValidationError(error)) {
    return 'Your cart data looks invalid. Please clear your cart and add the items again.';
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

  if (isValidationError(error)) {
    return {
      message: getQuoteErrorMessage(error, quote),
      action: {
        type: 'clearCart',
      },
    };
  }

  if (isRemovedItemError(error)) {
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
