import {
  formatOrderShortId,
  formatOrderStatus,
  getOrderActionLabel,
  getOrderStatusVariant,
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

  test('maps order statuses to shared badge variants', () => {
    expect(getOrderStatusVariant('paid')).toBe('success');
    expect(getOrderStatusVariant('completed')).toBe('success');
    expect(
      getOrderStatusVariant('completed', { completedVariant: 'neutral' }),
    ).toBe('neutral');
    expect(getOrderStatusVariant('cancelled')).toBe('danger');
    expect(getOrderStatusVariant('preparing')).toBe('warning');
  });

  test('formats admin order action labels', () => {
    expect(getOrderActionLabel('paid', 'preparing')).toBe('Start preparing');
    expect(getOrderActionLabel('pending_payment', 'cancelled')).toBe(
      'Cancel pending order',
    );
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
