import type { CartStoredItem } from '../types/cart';
import { cartSignature } from '../store/cart/utils/cart-signature';
import { createCheckoutAttemptKey } from './idempotency';

const storageKey = (userId: string) => `checkout-attempt:${userId}`;

interface StoredCheckoutAttempt {
  key: string;
  signature: string;
  supersededKeys: string[];
  orderId?: string;
}

const readStoredCheckoutAttempt = (
  userId: string,
): StoredCheckoutAttempt | null => {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return null;
  try {
    const attempt = JSON.parse(raw);
    if (
      typeof attempt?.key === 'string' &&
      typeof attempt.signature === 'string'
    ) {
      return {
        key: attempt.key,
        signature: attempt.signature,
        supersededKeys: Array.isArray(attempt.supersededKeys)
          ? attempt.supersededKeys.filter(
              (key: unknown): key is string => typeof key === 'string',
            )
          : [],
        ...(typeof attempt.orderId === 'string'
          ? { orderId: attempt.orderId }
          : {}),
      };
    }
  } catch {
    // Discard malformed browser storage before creating a new attempt.
  }
  localStorage.removeItem(storageKey(userId));
  return null;
};

export const readCheckoutAttempt = (
  userId: string,
  items: CartStoredItem[],
) => {
  const attempt = readStoredCheckoutAttempt(userId);
  return attempt?.signature === cartSignature(items) ? attempt.key : null;
};

export const getCheckoutAttempt = (userId: string, items: CartStoredItem[]) => {
  const previous = readStoredCheckoutAttempt(userId);
  const signature = cartSignature(items);
  if (previous?.signature === signature) return previous.key;
  const supersededKeys = previous
    ? [...new Set([...(previous.supersededKeys ?? []), previous.key])]
    : [];
  const key = createCheckoutAttemptKey();
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({ key, signature, supersededKeys }),
  );
  return key;
};

export const getSupersededCheckoutKeys = (userId: string): string[] => {
  return readStoredCheckoutAttempt(userId)?.supersededKeys ?? [];
};

export const acknowledgeSupersededCheckouts = (
  userId: string,
  key: string,
  orderId?: string,
) => {
  const attempt = readStoredCheckoutAttempt(userId);
  if (attempt?.key === key)
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({
        ...attempt,
        supersededKeys: [],
        ...(orderId ? { orderId } : {}),
      }),
    );
};

export const clearCheckoutAttempt = (userId: string) => {
  localStorage.removeItem(storageKey(userId));
};

export const finishPaidCheckoutAttempt = (
  userId: string,
  orderId: string,
  items: CartStoredItem[],
) => {
  const attempt = readStoredCheckoutAttempt(userId);
  if (!attempt || attempt.orderId !== orderId) return false;
  try {
    const storedItems = JSON.parse(
      localStorage.getItem('CartItemsState') ?? 'null',
    );
    const matches =
      attempt.signature === cartSignature(items) &&
      Array.isArray(storedItems) &&
      attempt.signature === cartSignature(storedItems);
    clearCheckoutAttempt(userId);
    return matches;
  } catch {
    return false;
  }
};
