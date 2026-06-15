import { HTTP_STATUS } from '../api/http-status';
import { ApiError } from '../api/request';

interface ErrorContext {
  source: string;
  operation?: string;
}

export const isExpectedBackgroundError = (error: unknown) =>
  error instanceof ApiError &&
  (error.statusCode === HTTP_STATUS.CONFLICT ||
    error.statusCode === HTTP_STATUS.REQUEST_CANCELLED);

export const isRequestCancelled = (error: unknown) =>
  error instanceof ApiError &&
  error.statusCode === HTTP_STATUS.REQUEST_CANCELLED;

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
