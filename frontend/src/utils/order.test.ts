import {
  formatOrderShortId,
  formatOrderStatus,
  summarizeOrderItems,
} from './order';

describe('order utils', () => {
  test('formats a display-only short order id', () => {
    expect(formatOrderShortId('64f012abc9a3f92c')).toBe('A3F92C');
    expect(formatOrderShortId('abc')).toBe('ABC');
  });

  test('formats order status labels', () => {
    expect(formatOrderStatus('pending_payment')).toBe('Pending payment');
    expect(formatOrderStatus('completed')).toBe('Completed');
  });

  test('summarizes order items with an optional limit', () => {
    const items = [
      { name: 'Sydney Club Burger', quantity: 2 },
      { name: 'Loaded Chips', quantity: 1 },
      { name: 'Thickshake', quantity: 3 },
    ];

    expect(summarizeOrderItems(items)).toBe(
      '2 x Sydney Club Burger, 1 x Loaded Chips, 3 x Thickshake',
    );
    expect(summarizeOrderItems(items, { limit: 2 })).toBe(
      '2 x Sydney Club Burger, 1 x Loaded Chips',
    );
  });
});
