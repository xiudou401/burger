import { TTL_MS } from '../config/ttl';

export const isCheckoutCreationRetrySafe = (
  createdAt: Date,
  now = Date.now(),
) => {
  const age = now - new Date(createdAt).getTime();
  return (
    Number.isFinite(age) &&
    age >= 0 &&
    age < TTL_MS.CHECKOUT_CREATION_RETRY_WINDOW
  );
};

export const isDefinitiveCheckoutCreationFailure = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const stripeError = error as { type?: string; code?: string };
  return (
    stripeError.type === 'StripeInvalidRequestError' &&
    stripeError.code !== 'idempotency_key_in_use'
  );
};
