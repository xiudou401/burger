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
      typeof attempt?.key === 'string' &&
      typeof attempt.signature === 'string'
    ) {
      return attempt.signature === cartSignature(items)
        ? (attempt.key as string)
        : null;
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
  const raw = localStorage.getItem(storageKey(userId));
  const previous = raw ? JSON.parse(raw) : null;
  const supersededKeys = previous
    ? [...new Set([...(previous.supersededKeys ?? []), previous.key])]
    : [];
  const key = createCheckoutAttemptKey();
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({ key, signature: cartSignature(items), supersededKeys }),
  );
  return key;
};

export const getSupersededCheckoutKeys = (userId: string): string[] => {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    const keys = JSON.parse(raw)?.supersededKeys;
    return Array.isArray(keys)
      ? keys.filter((key): key is string => typeof key === 'string')
      : [];
  } catch {
    return [];
  }
};

export const acknowledgeSupersededCheckouts = (
  userId: string,
  key: string,
  orderId?: string,
) => {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return;
  const attempt = JSON.parse(raw);
  if (attempt.key === key)
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
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return false;
  try {
    const attempt = JSON.parse(raw);
    if (attempt.orderId !== orderId) return false;
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
