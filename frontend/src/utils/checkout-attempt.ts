import type { CartStoredItem } from '../types/cart';
import { cartSignature } from '../store/cart/utils/cart-signature';
import { createCheckoutAttemptKey } from './idempotency';

const storageKey = (userId: string) => `checkout-attempt:${userId}`;

export const readCheckoutAttempt = (
  userId: string,
  items: CartStoredItem[],
) => {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return null;
  try {
    const attempt = JSON.parse(raw);
    if (
      typeof attempt.key === 'string' &&
      attempt.signature === cartSignature(items)
    ) {
      return attempt.key as string;
    }
  } catch {
    // Discard malformed browser storage before creating a new attempt.
  }
  localStorage.removeItem(storageKey(userId));
  return null;
};

export const getCheckoutAttempt = (userId: string, items: CartStoredItem[]) => {
  const existing = readCheckoutAttempt(userId, items);
  if (existing) return existing;
  const key = createCheckoutAttemptKey();
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({ key, signature: cartSignature(items) }),
  );
  return key;
};

export const clearCheckoutAttempt = (userId: string) => {
  localStorage.removeItem(storageKey(userId));
};
