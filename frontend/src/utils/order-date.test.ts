import {
  formatKitchenPlacedAt,
  formatOrderDay,
  orderDateRange,
  orderDayKey,
  formatOrderDateTime,
} from './order-date';
import { TZDate } from '@date-fns/tz';

const sydneyDate = (year: number, month: number, day: number, hour = 0) =>
  new TZDate(year, month, day, hour, 'Australia/Sydney');

const now = sydneyDate(2026, 10, 10, 12).getTime();

test('shows kitchen clock times today, and dates for orders from another day or year', () => {
  expect(
    formatKitchenPlacedAt(sydneyDate(2026, 10, 10, 11).toISOString(), now),
  ).not.toContain('2026');
  expect(
    formatKitchenPlacedAt(sydneyDate(2026, 10, 9, 23).toISOString(), now),
  ).toContain('2026');
  expect(
    formatKitchenPlacedAt(sydneyDate(2025, 10, 10, 11).toISOString(), now),
  ).toContain('2025');
  expect(formatKitchenPlacedAt('invalid', now)).toBe('Order time unavailable');
});

test('groups days by the Sydney calendar without confusing matching dates in different years', () => {
  expect(formatOrderDay(sydneyDate(2026, 10, 10).toISOString(), now)).toMatch(
    /^Today/,
  );
  expect(formatOrderDay(sydneyDate(2026, 10, 9).toISOString(), now)).toMatch(
    /^Yesterday/,
  );
  expect(
    formatOrderDay(sydneyDate(2025, 10, 10).toISOString(), now),
  ).not.toMatch(/Today|Yesterday/);
  expect(orderDayKey('bad')).toBeNull();
});

test('uses an inclusive calendar end date and the next midnight, including DST boundaries', () => {
  for (const date of ['2026-04-05', '2026-10-04', '2026-12-31']) {
    const range = orderDateRange(date, date);
    const start = new TZDate(range.from!, 'Australia/Sydney');
    const end = new TZDate(range.to!, 'Australia/Sydney');
    const next = new TZDate(start.getTime(), 'Australia/Sydney');
    next.setDate(next.getDate() + 1);
    expect(orderDayKey(start)).toBe(date);
    expect(end.getTime()).toBe(next.getTime());
    expect(end.getHours()).toBe(0);
  }
  expect(orderDateRange('', '')).toEqual({ from: undefined, to: undefined });
  expect(() => orderDateRange('2026-11-11', '2026-11-10')).toThrow('end date');
  expect(() => orderDateRange('2026-02-30', '')).toThrow('valid order dates');
});

test('uses Sydney midnight regardless of the host timezone and handles 23/25-hour days', () => {
  expect(orderDayKey('2026-11-10T13:30:00Z')).toBe('2026-11-11');
  expect(orderDateRange('2026-11-10', '2026-11-10')).toEqual({
    from: '2026-11-09T13:00:00.000Z',
    to: '2026-11-10T13:00:00.000Z',
  });
  for (const [day, hours] of [
    ['2026-04-05', 25],
    ['2026-10-04', 23],
  ] as const) {
    const range = orderDateRange(day, day);
    expect((Date.parse(range.to!) - Date.parse(range.from!)) / 3600000).toBe(
      hours,
    );
  }
  expect(formatOrderDateTime('invalid')).toBe('-');
});
