import { BaseError } from './BaseError';

export class AppError extends BaseError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode);
  }
}
