import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import { getQuoteErrorMessage, getRemovedItemId } from './quote-error';
import type { Quote } from '../../../types/cart';

const quote: Quote = {
  menuVersion: 1,
  ts: 1,
  menuItems: [
    {
      id: 'burger',
      name: 'Sydney Club Burger',
      description: 'Club burger',
      priceCents: 1500,
      category: 'burger',
      isAvailable: true,
      quantity: 1,
      subtotalCents: 1500,
      image: '/img/burger.png',
    },
  ],
};

describe('getQuoteErrorMessage', () => {
  it.each([
    HTTP_STATUS.NETWORK_ERROR,
    HTTP_STATUS.REQUEST_TIMEOUT,
    HTTP_STATUS.SERVER_ERROR_MIN,
    503,
  ])('uses a temporary outage message for status %s', (statusCode) => {
    expect(
      getQuoteErrorMessage(new ApiError(statusCode, { message: 'Failed' })),
    ).toBe('The server is temporarily unavailable. Please try again.');
  });

  it('uses a generic validation message for other failures', () => {
    expect(
      getQuoteErrorMessage(new ApiError(400, { message: 'Invalid cart' })),
    ).toBe('Could not validate your cart. Please try again.');
  });

  it('uses a cart review message for menu version conflicts', () => {
    expect(
      getQuoteErrorMessage(new ApiError(409, { message: 'Menu updated' })),
    ).toBe(
      'Some menu items have changed. Please review your cart before checkout.',
    );
  });

  it('uses a cart review message for removed menu items', () => {
    expect(
      getQuoteErrorMessage(new ApiError(400, { message: 'Menu item removed' })),
    ).toBe(
      'An item in your cart is no longer available. Please review your cart.',
    );
  });

  it('uses the removed item name when the API returns the missing item id', () => {
    expect(
      getQuoteErrorMessage(
        new ApiError(400, {
          message: 'Menu item removed',
          details: { itemId: 'burger' },
        }),
        quote,
      ),
    ).toBe(
      'Sydney Club Burger is no longer available. Please remove it from your cart.',
    );
  });
});

describe('getRemovedItemId', () => {
  it('returns the removed item id from structured API details', () => {
    expect(
      getRemovedItemId(
        new ApiError(400, {
          message: 'Menu item removed',
          details: { itemId: 'burger' },
        }),
      ),
    ).toBe('burger');
  });

  it('returns null for other errors', () => {
    expect(
      getRemovedItemId(new ApiError(400, { message: 'Invalid cart' })),
    ).toBeNull();
  });
});
