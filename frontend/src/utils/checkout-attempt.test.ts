import {
  clearCheckoutAttempt,
  getCheckoutAttemptKey,
  readCheckoutAttempt,
  getSupersededCheckoutKeys,
  acknowledgeSupersededCheckouts,
  finishPaidCheckoutAttempt,
  rememberPaidSupersededCheckout,
} from './checkout-attempt';

const items = [{ id: 'burger', quantity: 2 }];

beforeEach(() => localStorage.clear());

test('restores the same key after a new read and ignores item ordering', () => {
  const cart = [...items, { id: 'fries', quantity: 1 }];
  const key = getCheckoutAttemptKey('user-a', cart);
  expect(readCheckoutAttempt('user-a', [...cart].reverse())).toBe(key);
  expect(getCheckoutAttemptKey('user-a', cart)).toBe(key);
});

test('isolates users and starts a new attempt when quantities change', () => {
  const key = getCheckoutAttemptKey('user-a', items);
  expect(getCheckoutAttemptKey('user-b', items)).not.toBe(key);
  expect(
    getCheckoutAttemptKey('user-a', [{ id: 'burger', quantity: 3 }]),
  ).not.toBe(key);
});

test('clears completed attempts and tolerates malformed storage', () => {
  getCheckoutAttemptKey('user-a', items);
  clearCheckoutAttempt('user-a');
  expect(readCheckoutAttempt('user-a', items)).toBeNull();
  localStorage.setItem('checkout-attempt:user-a', 'invalid');
  expect(readCheckoutAttempt('user-a', items)).toBeNull();
});

test('retains old keys through cart changes and retries until acknowledged', () => {
  const first = getCheckoutAttemptKey('user-a', items);
  expect(readCheckoutAttempt('user-a', [])).toBeNull();
  const second = getCheckoutAttemptKey('user-a', [
    { id: 'fries', quantity: 1 },
  ]);
  expect(getSupersededCheckoutKeys('user-a')).toEqual([first]);
  expect(getCheckoutAttemptKey('user-a', [{ id: 'fries', quantity: 1 }])).toBe(
    second,
  );
  acknowledgeSupersededCheckouts('user-a', first);
  expect(getSupersededCheckoutKeys('user-a')).toEqual([first]);
  acknowledgeSupersededCheckouts('user-a', second);
  expect(getSupersededCheckoutKeys('user-a')).toEqual([]);
});

test('finishes only the matching paid order and unchanged cart', () => {
  const key = getCheckoutAttemptKey('user-a', items);
  acknowledgeSupersededCheckouts('user-a', key, 'order-a');
  localStorage.setItem('CartItemsState', JSON.stringify(items));
  expect(finishPaidCheckoutAttempt('user-a', 'order-b', items)).toBe(false);
  expect(readCheckoutAttempt('user-a', items)).toBe(key);
  expect(finishPaidCheckoutAttempt('user-a', 'order-a', items)).toBe(true);
  expect(readCheckoutAttempt('user-a', items)).toBeNull();
});

test('preserves carts edited in another tab after paying', () => {
  const key = getCheckoutAttemptKey('user-a', items);
  acknowledgeSupersededCheckouts('user-a', key, 'order-a');
  const newItems = [{ id: 'fries', quantity: 1 }];
  localStorage.setItem('CartItemsState', JSON.stringify(newItems));
  expect(finishPaidCheckoutAttempt('user-a', 'order-a', items)).toBe(false);
  expect(JSON.parse(localStorage.getItem('CartItemsState')!)).toEqual(newItems);
});

test('an older paid order does not clear a newer checkout attempt', () => {
  const oldKey = getCheckoutAttemptKey('user-a', items);
  acknowledgeSupersededCheckouts('user-a', oldKey, 'order-a');
  const newItems = [{ id: 'fries', quantity: 1 }];
  const newKey = getCheckoutAttemptKey('user-a', newItems);
  acknowledgeSupersededCheckouts('user-a', newKey, 'order-b');
  expect(finishPaidCheckoutAttempt('user-a', 'order-a', newItems)).toBe(false);
  expect(readCheckoutAttempt('user-a', newItems)).toBe(newKey);
});

test('acknowledges a confirmed older payment without losing the current cart or other old keys', () => {
  const first = getCheckoutAttemptKey('user-a', items);
  const secondItems = [{ id: 'burger', quantity: 3 }];
  const second = getCheckoutAttemptKey('user-a', secondItems);
  const currentItems = [{ id: 'burger', quantity: 4 }];
  const current = getCheckoutAttemptKey('user-a', currentItems);
  localStorage.setItem('CartItemsState', JSON.stringify(currentItems));
  rememberPaidSupersededCheckout('user-a', first, 'order-a');
  expect(getSupersededCheckoutKeys('user-a')).toEqual([first, second]);
  // A different or unconfirmed order must not acknowledge this payment.
  expect(finishPaidCheckoutAttempt('user-a', 'other-order', currentItems)).toBe(
    false,
  );
  expect(getSupersededCheckoutKeys('user-a')).toEqual([first, second]);
  expect(finishPaidCheckoutAttempt('user-a', 'order-a', currentItems)).toBe(
    false,
  );
  expect(getSupersededCheckoutKeys('user-a')).toEqual([second]);
  expect(readCheckoutAttempt('user-a', currentItems)).toBe(current);
  expect(JSON.parse(localStorage.getItem('CartItemsState')!)).toEqual(
    currentItems,
  );
});
