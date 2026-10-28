import mongoose from 'mongoose';
import {
  buildDemoMonthOrders,
  DEMO_MONTH_PREFIX,
} from '../scripts/seedDemoMonth';
import type { MenuItem, MenuItemCategory } from './models/menu-item.model';

const categories: MenuItemCategory[] = [
  'burger',
  'side',
  'drink',
  'dessert',
  'combo',
];
const menuItems = categories.map((category, index) => ({
  _id: new mongoose.Types.ObjectId(),
  name: `Demo ${category}`,
  category,
  priceCents: 500 + index * 100,
})) as (MenuItem & { _id: mongoose.Types.ObjectId })[];
const input = {
  now: new Date('2026-10-28T00:00:00Z'),
  userId: new mongoose.Types.ObjectId(),
  menuItems,
  menuVersion: 1,
};
const businessDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

describe('synthetic monthly orders', () => {
  it('covers exactly the previous 30 complete Sydney dates, including yesterday', () => {
    const orders = buildDemoMonthOrders(input);
    const dates = [
      ...new Set(orders.map((order) => businessDate(order.createdAt))),
    ];
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe('2026-09-28');
    expect(dates[29]).toBe('2026-10-27');
    expect(orders.every((order) => order.updatedAt < input.now)).toBe(true);
  });
  it('uses Sydney noon correctly across the daylight saving transition', () => {
    const orders = buildDemoMonthOrders(input);
    expect(orders[0].createdAt.toISOString()).toBe('2026-09-28T02:00:00.000Z');
    const noonAfterDst = orders.find(
      (order) =>
        order.checkoutIdempotencyKey === `${DEMO_MONTH_PREFIX}2026-10-10-00`,
    );
    expect(noonAfterDst?.createdAt.toISOString()).toBe(
      '2026-10-10T01:00:00.000Z',
    );
  });
  it('uses deterministic, unique demo keys and fake provider IDs without checkout URLs', () => {
    const orders = buildDemoMonthOrders(input);
    expect(
      new Set(orders.map((order) => order.checkoutIdempotencyKey)).size,
    ).toBe(orders.length);
    expect(buildDemoMonthOrders(input)).toEqual(orders);
    expect(
      orders.every(
        (order) =>
          order.checkoutIdempotencyKey?.startsWith(DEMO_MONTH_PREFIX) &&
          order.payment.providerPaymentId?.startsWith('demo_month_') &&
          !order.checkoutUrl,
      ),
    ).toBe(true);
  });
  it('keeps money consistent and limits orders to historical terminal states', () => {
    for (const order of buildDemoMonthOrders(input)) {
      expect(order.totalCents).toBe(
        order.items.reduce((sum, item) => sum + item.subtotalCents, 0),
      );
      expect(order.payment.amountCents).toBe(order.totalCents);
      expect(Number.isSafeInteger(order.totalCents)).toBe(true);
      expect(['completed', 'cancelled']).toContain(order.status);
      expect(order.cancelledAt !== undefined).toBe(
        order.status === 'cancelled',
      );
    }
  });
  it('includes a recent abandonment spike, failed payments and refunded cancellations', () => {
    const orders = buildDemoMonthOrders(input);
    const abandoned = orders.filter(
      (order) => order.cancellationReason === 'customer_abandoned_checkout',
    );
    expect(abandoned).toHaveLength(21);
    expect(
      abandoned.every(
        (order) => order.createdAt >= new Date('2026-10-20T13:00:00Z'),
      ),
    ).toBe(true);
    expect(orders.some((order) => order.payment.status === 'failed')).toBe(
      true,
    );
    expect(orders.some((order) => order.payment.status === 'refunded')).toBe(
      true,
    );
  });
  it('refuses incomplete menus and invalid dates before producing records', () => {
    expect(() =>
      buildDemoMonthOrders({ ...input, menuItems: menuItems.slice(1) }),
    ).toThrow('All five');
    expect(() =>
      buildDemoMonthOrders({ ...input, now: new Date('invalid') }),
    ).toThrow('Invalid dataset date');
  });
});
