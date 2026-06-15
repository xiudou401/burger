import { HTTP_STATUS } from '../api/http-status';
import { ApiError } from '../api/request';
import {
  isExpectedBackgroundError,
  isRequestCancelled,
  reportError,
} from './error-monitoring';

describe('error monitoring', () => {
  it.each([HTTP_STATUS.CONFLICT, HTTP_STATUS.REQUEST_CANCELLED])(
    'treats status %s as expected background control flow',
    (statusCode) => {
      expect(
        isExpectedBackgroundError(new ApiError(statusCode, { message: 'x' })),
      ).toBe(true);
    },
  );

  it('reports structured error details without the response body', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    reportError(
      new ApiError(HTTP_STATUS.SERVER_ERROR_MIN, {
        message: 'Server failed',
        type: 'ServiceError',
      }),
      { source: 'quote-engine', operation: 'background-validation' },
    );

    expect(consoleError).toHaveBeenCalledWith('[monitoring]', {
      source: 'quote-engine',
      operation: 'background-validation',
      name: 'ApiError',
      message: 'Server failed',
      statusCode: HTTP_STATUS.SERVER_ERROR_MIN,
      type: 'ServiceError',
    });

    consoleError.mockRestore();
  });

  it('identifies request cancellation without hiding other conflicts', () => {
    expect(
      isRequestCancelled(
        new ApiError(HTTP_STATUS.REQUEST_CANCELLED, { message: 'Cancelled' }),
      ),
    ).toBe(true);
    expect(
      isRequestCancelled(
        new ApiError(HTTP_STATUS.CONFLICT, { message: 'Conflict' }),
      ),
    ).toBe(false);
  });
});
