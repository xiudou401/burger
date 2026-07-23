import { BaseError } from './BaseError';

export class ServiceError extends BaseError {
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message, statusCode);
    this.details = details;
  }
}
