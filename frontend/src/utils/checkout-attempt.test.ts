import {
  clearCheckoutAttempt,
  getCheckoutAttempt,
  readCheckoutAttempt,
  getSupersededCheckoutKeys,
  acknowledgeSupersededCheckouts,
} from './checkout-attempt';

const items = [{ id: 'burger', quantity: 2 }];

beforeEach(() => localStorage.clear());

test('restores the same key after a new read and ignores item ordering', () => {
  const cart = [...items, { id: 'fries', quantity: 1 }];
  const key = getCheckoutAttempt('user-a', cart);
  expect(readCheckoutAttempt('user-a', [...cart].reverse())).toBe(key);
  expect(getCheckoutAttempt('user-a', cart)).toBe(key);
});

test('isolates users and starts a new attempt when quantities change', () => {
  const key = getCheckoutAttempt('user-a', items);
  expect(getCheckoutAttempt('user-b', items)).not.toBe(key);
  expect(
    getCheckoutAttempt('user-a', [{ id: 'burger', quantity: 3 }]),
  ).not.toBe(key);
});

test('clears completed attempts and tolerates malformed storage', () => {
  getCheckoutAttempt('user-a', items);
  clearCheckoutAttempt('user-a');
  expect(readCheckoutAttempt('user-a', items)).toBeNull();
  localStorage.setItem('checkout-attempt:user-a', 'invalid');
  expect(readCheckoutAttempt('user-a', items)).toBeNull();
});

test('retains old keys through cart changes and retries until acknowledged', () => {
  const first = getCheckoutAttempt('user-a', items);
  expect(readCheckoutAttempt('user-a', [])).toBeNull();
  const second = getCheckoutAttempt('user-a', [{ id: 'fries', quantity: 1 }]);
  expect(getSupersededCheckoutKeys('user-a')).toEqual([first]);
  expect(getCheckoutAttempt('user-a', [{ id: 'fries', quantity: 1 }])).toBe(
    second,
  );
  acknowledgeSupersededCheckouts('user-a', first);
  expect(getSupersededCheckoutKeys('user-a')).toEqual([first]);
  acknowledgeSupersededCheckouts('user-a', second);
  expect(getSupersededCheckoutKeys('user-a')).toEqual([]);
});
