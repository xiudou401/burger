import { API_STATUS } from '../../../api/api-status';
import { ApiError } from '../../../api/request';

export const getQuoteErrorMessage = (error: unknown) => {
  if (
    error instanceof ApiError &&
    (error.statusCode === API_STATUS.NETWORK_ERROR ||
      error.statusCode === API_STATUS.REQUEST_TIMEOUT ||
      error.statusCode >= API_STATUS.SERVER_ERROR_MIN)
  ) {
    return 'The server is temporarily unavailable. Please try again.';
  }

  return 'Could not validate your cart. Please try again.';
};
