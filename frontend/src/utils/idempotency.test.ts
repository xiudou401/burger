import { createCheckoutAttemptKey } from './idempotency';

describe('createCheckoutAttemptKey', () => {
  test('uses crypto randomUUID when available', () => {
    expect(
      createCheckoutAttemptKey({
        randomUUID: () => 'checkout-attempt-id',
      }),
    ).toBe('checkout-attempt-id');
  });

  test('falls back to an RFC4122-style v4 UUID', () => {
    const key = createCheckoutAttemptKey({
      randomUUID: undefined,
      random: () => 0,
    });

    expect(key).toBe('10000000-1000-4000-8000-100000000000');
  });
});
