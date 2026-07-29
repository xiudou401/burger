import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import { calculateTotals, getCheckoutErrorMessage } from './checkout-utils';

describe('calculateTotals', () => {
  test('calculates quantity and total cents from cart menu items', () => {
    expect(
      calculateTotals([
        {
          id: 'meal-1',
          name: 'Classic Burger',
          description: 'Beef burger',
          priceCents: 1200,
          category: 'burger',
          isAvailable: true,
          quantity: 2,
          subtotalCents: 2400,
          image: '/img/burger.png',
        },
        {
          id: 'meal-2',
          name: 'Fries',
          description: 'Crispy fries',
          priceCents: 500,
          category: 'side',
          isAvailable: true,
          quantity: 3,
          subtotalCents: 1500,
          image: '/img/fries.png',
        },
      ]),
    ).toEqual({
      totalQuantity: 5,
      totalCents: 3900,
    });
  });

  test('returns zero totals for an empty cart', () => {
    expect(calculateTotals([])).toEqual({
      totalQuantity: 0,
      totalCents: 0,
    });
  });
});

describe('getCheckoutErrorMessage', () => {
  test('shows forbidden business errors without a request reference', () => {
    expect(
      getCheckoutErrorMessage(
        new ApiError(HTTP_STATUS.FORBIDDEN, {
          message: 'Please verify your email before placing an order',
          requestId: 'request-123',
        }),
      ),
    ).toBe('Please verify your email before placing an order');
  });

  test('keeps request references for server errors', () => {
    expect(
      getCheckoutErrorMessage(
        new ApiError(HTTP_STATUS.SERVER_ERROR_MIN, {
          message: 'Database unavailable',
          requestId: 'request-123',
        }),
      ),
    ).toBe(
      'The server is temporarily unavailable. Please try again. Reference: request-123',
    );
  });
});
