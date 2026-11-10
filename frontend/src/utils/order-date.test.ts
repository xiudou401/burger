import {
  formatKitchenPlacedAt,
  formatOrderDay,
  orderDateRange,
  orderDayKey,
} from './order-date';

const now = new Date(2026, 10, 10, 12).getTime();

test('shows kitchen clock times today, and dates for orders from another day or year', () => {
  expect(
    formatKitchenPlacedAt(new Date(2026, 10, 10, 11).toISOString(), now),
  ).not.toContain('2026');
  expect(
    formatKitchenPlacedAt(new Date(2026, 10, 9, 23).toISOString(), now),
  ).toContain('2026');
  expect(
    formatKitchenPlacedAt(new Date(2025, 10, 10, 11).toISOString(), now),
  ).toContain('2025');
  expect(formatKitchenPlacedAt('invalid', now)).toBe('Order time unavailable');
});

test('groups days by the local calendar without confusing matching dates in different years', () => {
  expect(formatOrderDay(new Date(2026, 10, 10).toISOString(), now)).toMatch(
    /^Today/,
  );
  expect(formatOrderDay(new Date(2026, 10, 9).toISOString(), now)).toMatch(
    /^Yesterday/,
  );
  expect(formatOrderDay(new Date(2025, 10, 10).toISOString(), now)).not.toMatch(
    /Today|Yesterday/,
  );
  expect(orderDayKey('bad')).toBeNull();
});

test('uses an inclusive calendar end date and the next midnight, including DST boundaries', () => {
  for (const date of ['2026-04-05', '2026-10-04', '2026-12-31']) {
    const range = orderDateRange(date, date);
    const start = new Date(range.from!);
    const end = new Date(range.to!);
    const next = new Date(start);
    next.setDate(next.getDate() + 1);
    expect(orderDayKey(start)).toBe(date);
    expect(end.getTime()).toBe(next.getTime());
    expect(end.getHours()).toBe(0);
  }
  expect(orderDateRange('', '')).toEqual({ from: undefined, to: undefined });
  expect(() => orderDateRange('2026-11-11', '2026-11-10')).toThrow('end date');
  expect(() => orderDateRange('2026-02-30', '')).toThrow('valid order dates');
});
