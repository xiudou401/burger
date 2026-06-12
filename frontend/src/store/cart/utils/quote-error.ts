import { ApiError } from '../../../api/request';

export const getQuoteErrorMessage = (error: unknown) => {
  if (
    error instanceof ApiError &&
    (error.statusCode === 0 ||
      error.statusCode === 408 ||
      error.statusCode >= 500)
  ) {
    return 'The server is temporarily unavailable. Please try again.';
  }

  return 'Could not validate your cart. Please try again.';
};
