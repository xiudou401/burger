import mongoose from 'mongoose';
import { MenuItemModel, type MenuItem } from '../src/models/menu-item.model';
import { OrderModel, type Order } from '../src/models/order.model';
import { UserModel } from '../src/models/user.model';

const TIME_ZONE = 'Australia/Sydney';
export const DEMO_MONTH_PREFIX = 'demo-month-v1-';
type DemoMenuItem = MenuItem & { _id: mongoose.Types.ObjectId };
type DemoOrder = Omit<Order, '__v'> & { checkoutIdempotencyKey: string };

const dateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
};

export const buildDemoMonthOrders = ({
  now,
  userId,
  menuItems,
  menuVersion,
}: {
  now: Date;
  userId: mongoose.Types.ObjectId;
  menuItems: DemoMenuItem[];
  menuVersion: number;
}): DemoOrder[] => {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid dataset date');
  const groups = Object.fromEntries(
    ['burger', 'side', 'drink', 'dessert', 'combo'].map((category) => [
      category,
      menuItems
        .filter((item) => item.category === category)
        .sort((a, b) => String(a._id).localeCompare(String(b._id))),
    ]),
  );
  if (Object.values(groups).some((items) => items.length === 0)) {
    throw new Error('All five menu categories are required before seeding');
  }
  const today = dateParts(now);
  const orders: DemoOrder[] = [];
  for (let dayOffset = 30; dayOffset >= 1; dayOffset -= 1) {
    const calendarDate = new Date(
      Date.UTC(today.year, today.month - 1, today.day - dayOffset),
    );
    const dateKey = calendarDate.toISOString().slice(0, 10);
    const weekend = [0, 6].includes(calendarDate.getUTCDay());
    const count = 8 + (dayOffset % 5) * 2 + (weekend ? 4 : 0);
    // Offset is sampled after Sydney's DST transition; all synthetic sales occur at noon or later.
    const utcSample = new Date(calendarDate.getTime() + 12 * 60 * 60_000);
    const localSample = dateParts(utcSample);
    const offsetHours = (localSample.hour - 12 + 24) % 24;
    for (let index = 0; index < count; index += 1) {
      const serial = dayOffset * 100 + index;
      const abandoned = dayOffset <= 7 && index < 3;
      const paymentFailed = !abandoned && serial % 23 === 0;
      const staffCancelled = !abandoned && !paymentFailed && serial % 37 === 0;
      const cancelled = abandoned || paymentFailed || staffCancelled;
      const categories =
        index % 4 === 0
          ? ['combo', 'dessert']
          : index % 3 === 0
            ? ['burger']
            : ['burger', 'side', 'drink'];
      const items = categories.map((category, itemIndex) => {
        const candidates = groups[category];
        const item = candidates[(serial + itemIndex) % candidates.length];
        const quantity = category === 'side' && serial % 7 === 0 ? 2 : 1;
        return {
          menuItemId: item._id,
          nameAtPurchase: item.name,
          imageAtPurchase: item.image,
          categoryAtPurchase: item.category,
          priceCentsAtPurchase: item.priceCents,
          quantity,
          subtotalCents: item.priceCents * quantity,
        };
      });
      const createdAt = new Date(
        calendarDate.getTime() +
          ((abandoned ? 18 : 12 + (index % 9)) - offsetHours) * 60 * 60_000 +
          ((index * 7) % 60) * 60_000,
      );
      const totalCents = items.reduce(
        (sum, item) => sum + item.subtotalCents,
        0,
      );
      const key = `${DEMO_MONTH_PREFIX}${dateKey}-${String(index).padStart(2, '0')}`;
      orders.push({
        userId,
        items,
        totalCents,
        menuVersion,
        checkoutIdempotencyKey: key,
        status: cancelled ? 'cancelled' : 'completed',
        cancellationReason: abandoned
          ? 'customer_abandoned_checkout'
          : paymentFailed
            ? 'payment_failed'
            : staffCancelled
              ? 'staff_cancelled'
              : undefined,
        cancelledAt: cancelled
          ? new Date(createdAt.getTime() + 12 * 60_000)
          : undefined,
        payment: {
          provider: 'stripe',
          providerPaymentId: `demo_month_${dateKey}_${index}`,
          status: abandoned
            ? 'cancelled'
            : paymentFailed
              ? 'failed'
              : staffCancelled
                ? 'refunded'
                : 'paid',
          amountCents: totalCents,
          currency: 'aud',
          paidAt:
            !abandoned && !paymentFailed
              ? new Date(createdAt.getTime() + 2 * 60_000)
              : undefined,
        },
        createdAt,
        updatedAt: new Date(
          createdAt.getTime() + (cancelled ? 12 : 28) * 60_000,
        ),
      });
    }
  }
  return orders;
};

export const seedDemoMonth = async (apply: boolean) => {
  if (apply && process.env.ALLOW_DEMO_ORDER_SEED !== 'true') {
    throw new Error(
      'Set ALLOW_DEMO_ORDER_SEED=true to permit synthetic order inserts',
    );
  }
  const { connectDB } = await import('../src/config/db');
  const { getMenuVersion } = await import('../src/services/menu.service');
  await connectDB();
  try {
    const [customer, menuItems, menuVersion] = await Promise.all([
      UserModel.findOne({
        email: 'customer@burgerclub.test',
        role: 'customer',
        status: 'disabled',
      })
        .lean()
        .exec(),
      MenuItemModel.find().lean().exec(),
      getMenuVersion(),
    ]);
    if (!customer)
      throw new Error(
        'An existing disabled demo customer is required; no accounts will be created or changed',
      );
    const orders = buildDemoMonthOrders({
      now: new Date(),
      userId: customer._id,
      menuItems,
      menuVersion,
    });
    for (const order of orders) await new OrderModel(order).validate();
    const keys = orders.map((order) => order.checkoutIdempotencyKey);
    const existing = await OrderModel.countDocuments({
      userId: customer._id,
      checkoutIdempotencyKey: { $in: keys },
    });
    const summary = {
      synthetic: true,
      timeZone: TIME_ZONE,
      days: 30,
      startAt: new Date(
        Math.min(...orders.map((order) => order.createdAt.getTime())),
      ).toISOString(),
      endAt: new Date(
        Math.max(...orders.map((order) => order.createdAt.getTime())),
      ).toISOString(),
      planned: orders.length,
      alreadyPresent: existing,
      paid: orders.filter((order) => order.payment.status === 'paid').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
      paidRevenueCents: orders
        .filter((order) => order.payment.status === 'paid')
        .reduce((sum, order) => sum + order.totalCents, 0),
    };
    if (!apply) return { ...summary, inserted: 0, dryRun: true };
    const result = await OrderModel.bulkWrite(
      orders.map((order) => ({
        updateOne: {
          filter: {
            userId: order.userId,
            checkoutIdempotencyKey: order.checkoutIdempotencyKey,
          },
          update: { $setOnInsert: order },
          upsert: true,
          timestamps: false,
        },
      })),
    );
    const stored = await OrderModel.countDocuments({
      userId: customer._id,
      checkoutIdempotencyKey: { $in: keys },
    });
    if (stored !== orders.length)
      throw new Error('Dataset count verification failed');
    return {
      ...summary,
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      stored,
      dryRun: false,
    };
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedDemoMonth(process.argv.includes('--apply'))
    .then((summary) => console.log(JSON.stringify(summary)))
    .catch(() => {
      console.error(
        'Demo month seed failed; database credentials and raw errors withheld',
      );
      process.exitCode = 1;
    });
}
