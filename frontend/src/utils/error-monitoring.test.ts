import { API_STATUS } from '../api/api-status';
import { ApiError } from '../api/request';
import { isExpectedBackgroundError, reportError } from './error-monitoring';

describe('error monitoring', () => {
  it.each([API_STATUS.CONFLICT, API_STATUS.REQUEST_CANCELLED])(
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
      new ApiError(API_STATUS.SERVER_ERROR_MIN, {
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
      statusCode: API_STATUS.SERVER_ERROR_MIN,
      type: 'ServiceError',
    });

    consoleError.mockRestore();
  });
});
