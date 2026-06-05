import { BaseError } from './BaseError';

export class InfrastructureError extends BaseError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode, false);
  }
}
