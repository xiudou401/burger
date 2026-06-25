import { ServiceError } from './ServiceError';

export class ConcurrentRefreshError extends ServiceError {
  constructor() {
    super('Refresh already in progress', 409);
  }
}
