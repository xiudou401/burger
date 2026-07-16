import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  test('formats AUD cents with local dollar display', () => {
    expect(formatCurrency(1490)).toBe('$14.90');
    expect(formatCurrency(650)).toBe('$6.50');
  });
});
