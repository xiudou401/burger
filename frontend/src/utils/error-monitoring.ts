import { API_STATUS } from '../api/api-status';
import { ApiError } from '../api/request';

interface ErrorContext {
  source: string;
  operation?: string;
}

export const isExpectedBackgroundError = (error: unknown) =>
  error instanceof ApiError &&
  (error.statusCode === API_STATUS.CONFLICT ||
    error.statusCode === API_STATUS.REQUEST_CANCELLED);

export const reportError = (error: unknown, context: ErrorContext) => {
  const details =
    error instanceof ApiError
      ? {
          name: error.name,
          message: error.message,
          statusCode: error.statusCode,
          type: error.body.type,
        }
      : {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : String(error),
        };

  console.error('[monitoring]', {
    ...context,
    ...details,
  });
};
