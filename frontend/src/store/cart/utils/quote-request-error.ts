export class QuoteRequestInactiveError extends Error {
  constructor() {
    super('Quote request was cancelled or replaced');
    this.name = 'QuoteRequestInactiveError';
  }
}
