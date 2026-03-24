import { BaseError } from './BaseError';

export class ServiceError extends BaseError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode);
  }
}
