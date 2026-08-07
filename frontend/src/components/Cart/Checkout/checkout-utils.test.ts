import { HTTP_STATUS } from '../../../api/http-status';
import { ApiError } from '../../../api/request';
import { getCheckoutErrorMessage } from './checkout-utils';

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
