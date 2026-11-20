import {
  isCheckoutCreationRetrySafe,
  isDefinitiveCheckoutCreationFailure,
} from './checkout-recovery-policy';

test('bounds all creation recovery by order age with a margin before provider key expiry', () => {
  const now = Date.parse('2026-11-20T12:00:00Z');
  expect(isCheckoutCreationRetrySafe(new Date(now), now)).toBe(true);
  expect(
    isCheckoutCreationRetrySafe(new Date(now - 23 * 60 * 60_000 + 1), now),
  ).toBe(true);
  expect(
    isCheckoutCreationRetrySafe(new Date(now - 23 * 60 * 60_000), now),
  ).toBe(false);
  expect(isCheckoutCreationRetrySafe(new Date(now + 1), now)).toBe(false);
  expect(isCheckoutCreationRetrySafe(new Date('invalid'), now)).toBe(false);
});

test('treats validation rejection as definite, but concurrent, network and server errors as unknown', () => {
  expect(
    isDefinitiveCheckoutCreationFailure({
      type: 'StripeInvalidRequestError',
      code: 'parameter_invalid_integer',
    }),
  ).toBe(true);
  for (const error of [
    new Error('timeout'),
    { type: 'StripeAPIError' },
    { type: 'StripeConnectionError' },
    { type: 'StripeIdempotencyError' },
    { type: 'StripeInvalidRequestError', code: 'idempotency_key_in_use' },
  ]) {
    expect(isDefinitiveCheckoutCreationFailure(error)).toBe(false);
  }
});
