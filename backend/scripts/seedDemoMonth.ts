import mongoose from 'mongoose';
import { MenuItemModel, type MenuItem } from '../src/models/menu-item.model';
import { OrderModel, type Order } from '../src/models/order.model';
import { UserModel } from '../src/models/user.model';

const TIME_ZONE = 'Australia/Sydney';
export const DEMO_MONTH_PREFIX = 'demo-month-v1-';
export const demoOrderReplacementFilter = (
  userId: mongoose.Types.ObjectId,
) => ({
  userId,
  $or: [
    {
      checkoutIdempotencyKey: /^demo-month-v1-/,
      'payment.providerPaymentId': /^demo_month_/,
    },
    {
      checkoutIdempotencyKey: /^demo-order-/,
      'payment.providerPaymentId': /^cs_demo_/,
    },
  ],
});
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

export const buildDemoKitchenOrders = (
  input: Parameters<typeof buildDemoMonthOrders>[0],
): DemoOrder[] => {
  const { now } = input;
  const local = dateParts(now);
  const dateKey = `${local.year}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`;
  const statuses = [
    'confirmed',
    'preparing',
    'ready',
    'pending_payment',
  ] as const;
  return buildDemoMonthOrders(input)
    .slice(0, 12)
    .map((sample, index) => {
      const status = statuses[Math.floor(index / 3)];
      const createdAt = new Date(now.getTime() - (45 - index * 3) * 60_000);
      return {
        ...sample,
        checkoutIdempotencyKey: `${DEMO_MONTH_PREFIX}kitchen-${dateKey}-${index}`,
        status,
        cancellationReason: undefined,
        cancelledAt: undefined,
        payment: {
          provider: 'stripe',
          providerPaymentId: `demo_month_kitchen_${dateKey}_${index}`,
          status: status === 'pending_payment' ? 'requires_payment' : 'paid',
          currency: 'aud',
          paidAt:
            status === 'pending_payment'
              ? undefined
              : new Date(createdAt.getTime() + 60_000),
        },
        createdAt,
        updatedAt: new Date(
          Math.min(now.getTime(), createdAt.getTime() + 2 * 60_000),
        ),
      };
    });
};

export const buildDemoDailyOrders = (
  input: Parameters<typeof buildDemoMonthOrders>[0],
  random = Math.random,
): DemoOrder[] => {
  const samples = buildDemoMonthOrders(input);
  const local = dateParts(input.now);
  const day = `${local.year}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`;
  const statuses = [
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled',
  ] as const;
  const count = 12 + Math.floor(random() * 13);
  return Array.from({ length: count }, (_, index) => {
    const sample = samples[Math.floor(random() * samples.length)];
    const status = statuses[index < 3 ? index : 3 + Math.floor(random() * 2)];
    // Keep today's samples on today's Sydney date, even for a midnight manual run.
    let createdAt = new Date(
      input.now.getTime() - Math.floor(random() * 45) * 60_000,
    );
    if (dateParts(createdAt).day !== local.day) createdAt = new Date(input.now);
    const items = sample.items.map((item) => {
      const quantity = 1 + Math.floor(random() * 3);
      return {
        ...item,
        quantity,
        subtotalCents: item.priceCentsAtPurchase * quantity,
      };
    });
    return {
      ...sample,
      items,
      totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
      checkoutIdempotencyKey: `demo-daily-v1-${day}-${String(index).padStart(2, '0')}`,
      status,
      cancellationReason:
        status === 'cancelled' ? 'customer_abandoned_checkout' : undefined,
      cancelledAt: status === 'cancelled' ? new Date(input.now) : undefined,
      payment: {
        provider: 'stripe',
        providerPaymentId: `demo_daily_${day}_${index}`,
        status: status === 'cancelled' ? 'cancelled' : 'paid',
        currency: 'aud',
        paidAt: status === 'cancelled' ? undefined : createdAt,
      },
      createdAt,
      updatedAt: new Date(input.now),
    };
  });
};

export const seedDemoMonth = async (
  apply: boolean,
  includeKitchen = false,
  replace = false,
  daily = false,
) => {
  if (daily && replace) throw new Error('Daily mode is append-only');
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
    const input = {
      now: new Date(),
      userId: customer._id,
      menuItems,
      menuVersion,
    };
    const orders = daily
      ? buildDemoDailyOrders(input)
      : [
          ...buildDemoMonthOrders(input),
          ...(includeKitchen ? buildDemoKitchenOrders(input) : []),
        ];
    for (const order of orders) await new OrderModel(order).validate();
    const keys = orders.map((order) => order.checkoutIdempotencyKey);
    const existing = await OrderModel.countDocuments({
      userId: customer._id,
      checkoutIdempotencyKey: { $in: keys },
    });
    const replacementFilter = demoOrderReplacementFilter(customer._id);
    const replaceable = replace
      ? await OrderModel.countDocuments(replacementFilter)
      : 0;
    const summary = {
      synthetic: true,
      timeZone: TIME_ZONE,
      days: daily ? 1 : 30,
      startAt: new Date(
        Math.min(...orders.map((order) => order.createdAt.getTime())),
      ).toISOString(),
      endAt: new Date(
        Math.max(...orders.map((order) => order.createdAt.getTime())),
      ).toISOString(),
      planned: orders.length,
      kitchenSamples: daily ? 3 : includeKitchen ? 12 : 0,
      alreadyPresent: existing,
      replacement: replace,
      replaceable,
      paid: orders.filter((order) => order.payment.status === 'paid').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
      paidRevenueCents: orders
        .filter((order) => order.payment.status === 'paid')
        .reduce((sum, order) => sum + order.totalCents, 0),
    };
    if (!apply) return { ...summary, inserted: 0, dryRun: true };
    if (daily) {
      const prefix = orders[0].checkoutIdempotencyKey.replace(/\d{2}$/, '');
      const dailyFilter = {
        userId: customer._id,
        checkoutIdempotencyKey: { $regex: `^${prefix}` },
      };
      const result = await mongoose.connection.transaction(async (session) => {
        const stored =
          await OrderModel.countDocuments(dailyFilter).session(session);
        if (stored > 0) return { inserted: 0, stored, skipped: true };
        await OrderModel.insertMany(orders, { session, timestamps: false });
        return {
          inserted: orders.length,
          stored: orders.length,
          skipped: false,
        };
      });
      return { ...summary, ...result, dryRun: false };
    }
    if (replace) {
      const deleted = await mongoose.connection.transaction(async (session) => {
        const result = await OrderModel.deleteMany(replacementFilter, {
          session,
        });
        await OrderModel.insertMany(orders, { session, timestamps: false });
        const stored = await OrderModel.countDocuments({
          userId: customer._id,
          checkoutIdempotencyKey: { $in: keys },
        }).session(session);
        if (stored !== orders.length)
          throw new Error('Dataset count verification failed');
        return result.deletedCount;
      });
      return {
        ...summary,
        deleted,
        inserted: orders.length,
        stored: orders.length,
        dryRun: false,
      };
    }
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
  seedDemoMonth(
    process.argv.includes('--apply'),
    process.argv.includes('--include-kitchen'),
    process.argv.includes('--replace'),
    process.argv.includes('--daily'),
  )
    .then((summary) => console.log(JSON.stringify(summary)))
    .catch(() => {
      console.error(
        'Demo month seed failed; database credentials and raw errors withheld',
      );
      process.exitCode = 1;
    });
}
