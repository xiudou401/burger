import { API_STATUS } from '../../../api/api-status';
import { ApiError } from '../../../api/request';
import { getQuoteErrorMessage } from './quote-error';

describe('getQuoteErrorMessage', () => {
  it.each([
    API_STATUS.NETWORK_ERROR,
    API_STATUS.REQUEST_TIMEOUT,
    API_STATUS.SERVER_ERROR_MIN,
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
});
