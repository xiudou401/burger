import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import type { Quote, QuoteErrorAction } from '../../../types/cart';

const VALIDATION_ERROR_TYPE = 'ValidationError';
const MENU_ITEM_REMOVED_CODE = 'MENU_ITEM_REMOVED';
const CART_ITEMS_INVALID_CODE = 'CART_ITEMS_INVALID';

type InvalidCartItem = {
  itemId?: unknown;
  reason?: unknown;
  name?: unknown;
};

const isValidationError = (error: unknown) =>
  error instanceof ApiError && error.body.type === VALIDATION_ERROR_TYPE;

export const isRemovedItemError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  error.body.details?.code === MENU_ITEM_REMOVED_CODE;

const isInvalidCartItemsError = (error: unknown): error is ApiError =>
  error instanceof ApiError &&
  error.body.details?.code === CART_ITEMS_INVALID_CODE;

const getInvalidCartItems = (error: unknown) => {
  if (!isInvalidCartItemsError(error)) return [];

  const items = error.body.details?.items;

  return Array.isArray(items) ? (items as InvalidCartItem[]) : [];
};

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

const getInvalidCartItemsMessage = (error: unknown, quote?: Quote | null) => {
  const invalidItems = getInvalidCartItems(error);
  const removedItemIds = invalidItems
    .filter((item) => item.reason === 'removed')
    .map((item) => item.itemId)
    .filter((itemId): itemId is string => typeof itemId === 'string');

  const soldOutNames = invalidItems
    .filter((item) => item.reason === 'sold_out')
    .map((item) =>
      typeof item.name === 'string'
        ? item.name
        : quote?.menuItems.find((menuItem) => menuItem.id === item.itemId)
            ?.name,
    )
    .filter((name): name is string => typeof name === 'string');

  const removedNames = removedItemIds
    .map((itemId) => getRemovedItemName(itemId, quote))
    .filter((name): name is string => typeof name === 'string');

  const names = [...removedNames, ...soldOutNames];

  if (names.length === 1) {
    return `${names[0]} is no longer available. Please review your cart.`;
  }

  if (names.length > 1 && names.length <= 3) {
    return `${names.join(', ')} are no longer available. Please review your cart.`;
  }

  return 'Some items in your cart are no longer available. Please review your cart.';
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

  if (isInvalidCartItemsError(error)) {
    return getInvalidCartItemsMessage(error, quote);
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

  if (isInvalidCartItemsError(error)) {
    return {
      message: getInvalidCartItemsMessage(error, quote),
      action: null,
    };
  }

  return {
    message: getQuoteErrorMessage(error, quote),
    action: null,
  };
};
