import '../src/config/env';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import {
  MenuItemModel,
  type MenuItem,
  type MenuItemCategory,
} from '../src/models/menu-item.model';
import {
  OrderModel,
  type CancellationReason,
  type OrderStatus,
  type PaymentStatus,
} from '../src/models/order.model';
import { UserModel } from '../src/models/user.model';
import { getMenuVersion } from '../src/services/menu.service';

type DemoMenuItem = MenuItem & { _id: mongoose.Types.ObjectId };

interface DemoOrderPattern {
  categories: MenuItemCategory[];
  dayOffset: number;
  hour: number;
  minute: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  cancellationReason?: CancellationReason;
}

const DEMO_ORDER_COUNT = 96;
const DAY_MS = 24 * 60 * 60 * 1000;

const assertDemoSeedAllowed = () => {
  if (process.env.ALLOW_DEMO_ORDER_SEED !== 'true') {
    throw new Error(
      'Refusing to seed demo orders. Set ALLOW_DEMO_ORDER_SEED=true to confirm this write operation.',
    );
  }
};

const groupMenuItemsByCategory = (items: DemoMenuItem[]) => {
  return items.reduce(
    (groups, item) => {
      groups[item.category] = [...groups[item.category], item];
      return groups;
    },
    {
      burger: [],
      side: [],
      drink: [],
      dessert: [],
      combo: [],
    } as Record<MenuItemCategory, DemoMenuItem[]>,
  );
};

const pickMenuItem = (
  groups: Record<MenuItemCategory, DemoMenuItem[]>,
  category: MenuItemCategory,
  index: number,
) => {
  const candidates = groups[category];
  const item = candidates[index % candidates.length];

  if (!item) {
    throw new Error(`Menu item category not found: ${category}`);
  }

  return item;
};

const buildOrderItem = (menuItem: DemoMenuItem, quantity: number) => ({
  menuItemId: menuItem._id,
  nameAtPurchase: menuItem.name,
  imageAtPurchase: menuItem.image,
  categoryAtPurchase: menuItem.category,
  priceCentsAtPurchase: menuItem.priceCents,
  quantity,
  subtotalCents: menuItem.priceCents * quantity,
});

const getBasePattern = (index: number): DemoOrderPattern => {
  const categoriesByMeal = [
    ['burger', 'side', 'drink'],
    ['combo'],
    ['burger', 'drink'],
    ['burger', 'side'],
    ['burger', 'side', 'drink'],
    ['side', 'drink'],
    ['burger', 'dessert'],
    ['combo', 'dessert'],
    ['burger'],
    ['drink'],
  ] satisfies MenuItemCategory[][];

  const paidStatuses: OrderStatus[] = [
    'paid',
    'preparing',
    'ready',
    'completed',
  ];

  return {
    categories: categoriesByMeal[index % categoriesByMeal.length],
    dayOffset: index % 30,
    hour: index % 3 === 0 ? 12 : 17 + (index % 4),
    minute: (index * 11) % 60,
    status: paidStatuses[index % paidStatuses.length],
    paymentStatus: 'paid',
  };
};

const getDemoPattern = (index: number): DemoOrderPattern => {
  const pattern = getBasePattern(index);

  // Intentional current-window anomaly for the AI operations investigation.
  if ([1, 5, 9, 13, 17].includes(index)) {
    return {
      ...pattern,
      dayOffset: index % 7,
      hour: 18,
      minute: 5 + index,
      status: 'cancelled',
      paymentStatus: 'cancelled',
      cancellationReason: 'customer_abandoned_checkout',
    };
  }

  if (index % 23 === 0) {
    return {
      ...pattern,
      status: 'cancelled',
      paymentStatus: 'failed',
      cancellationReason: 'payment_failed',
    };
  }

  if (index % 29 === 0) {
    return {
      ...pattern,
      status: 'cancelled',
      paymentStatus: 'paid',
      cancellationReason: 'staff_cancelled',
    };
  }

  if (index % 19 === 0) {
    return {
      ...pattern,
      status: 'pending_payment',
      paymentStatus: 'failed',
    };
  }

  return pattern;
};

const getCreatedAt = (pattern: DemoOrderPattern, index: number) => {
  const createdAt = new Date(Date.now() - pattern.dayOffset * DAY_MS);
  createdAt.setHours(pattern.hour, pattern.minute, index % 2 === 0 ? 0 : 30, 0);
  return createdAt;
};

const createDemoOrder = ({
  userId,
  menuItems,
  menuVersion,
  index,
}: {
  userId: mongoose.Types.ObjectId;
  menuItems: DemoMenuItem[];
  menuVersion: number;
  index: number;
}) => {
  const pattern = getDemoPattern(index);
  const createdAt = getCreatedAt(pattern, index);
  const menuGroups = groupMenuItemsByCategory(menuItems);
  const items = pattern.categories.map((category, itemIndex) =>
    buildOrderItem(
      pickMenuItem(menuGroups, category, index + itemIndex),
      index % 11 === 0 && category === 'side' ? 2 : 1,
    ),
  );
  const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
  const paidAt =
    pattern.paymentStatus === 'paid'
      ? new Date(createdAt.getTime() + 5 * 60_000)
      : undefined;
  const cancelledAt =
    pattern.status === 'cancelled'
      ? new Date(createdAt.getTime() + 12 * 60_000)
      : undefined;

  return {
    userId,
    items,
    totalCents,
    menuVersion,
    checkoutIdempotencyKey: `demo-order-${index}`,
    checkoutUrl: `https://checkout.stripe.test/demo-order-${index}`,
    status: pattern.status,
    cancellationReason: pattern.cancellationReason,
    cancelledAt,
    payment: {
      provider: 'stripe' as const,
      providerPaymentId: `cs_demo_${index}`,
      status: pattern.paymentStatus,
      amountCents: totalCents,
      currency: 'aud',
      paidAt,
    },
    createdAt,
    updatedAt:
      cancelledAt ?? new Date(createdAt.getTime() + (paidAt ? 28 : 6) * 60_000),
  };
};

const getFallbackCancellationReason = (
  paymentStatus?: PaymentStatus,
): CancellationReason => {
  if (paymentStatus === 'failed') {
    return 'payment_failed';
  }

  if (paymentStatus === 'cancelled' || paymentStatus === 'requires_payment') {
    return 'customer_abandoned_checkout';
  }

  return 'staff_cancelled';
};

const backfillExistingOrderSnapshots = async (menuItems: DemoMenuItem[]) => {
  const menuCategoryById = new Map(
    menuItems.map((item) => [String(item._id), item.category]),
  );

  const orders = await OrderModel.find({
    $or: [
      { 'items.categoryAtPurchase': { $exists: false } },
      { status: 'cancelled', cancellationReason: { $exists: false } },
      { status: 'cancelled', cancelledAt: { $exists: false } },
      { 'payment.status': 'paid', 'payment.paidAt': { $exists: false } },
    ],
  }).exec();

  let updatedCount = 0;

  for (const order of orders) {
    let changed = false;

    for (const item of order.items) {
      if (item.categoryAtPurchase) {
        continue;
      }

      const category = menuCategoryById.get(String(item.menuItemId));
      if (category) {
        item.categoryAtPurchase = category;
        changed = true;
      }
    }

    if (order.payment.status === 'paid' && !order.payment.paidAt) {
      order.payment.paidAt = order.updatedAt ?? order.createdAt;
      changed = true;
    }

    if (order.status === 'cancelled') {
      if (!order.cancellationReason) {
        order.cancellationReason = getFallbackCancellationReason(
          order.payment.status,
        );
        changed = true;
      }

      if (!order.cancelledAt) {
        order.cancelledAt = order.updatedAt ?? order.createdAt;
        changed = true;
      }
    }

    if (changed) {
      await order.save();
      updatedCount += 1;
    }
  }

  return updatedCount;
};

(async () => {
  assertDemoSeedAllowed();
  await connectDB();

  const [demoCustomer, menuItems, menuVersion] = await Promise.all([
    UserModel.findOne({ email: 'customer@burgerclub.test' }).lean().exec(),
    MenuItemModel.find().lean().exec(),
    getMenuVersion(),
  ]);

  if (!demoCustomer?._id) {
    throw new Error('Demo customer not found. Run seed:demo-users first.');
  }

  if (menuItems.length === 0) {
    throw new Error('Menu is empty. Run seed:menu-items first.');
  }

  const typedMenuItems = menuItems as DemoMenuItem[];
  let backfilledOrders = 0;

  if (process.env.BACKFILL_EXISTING_ORDER_SNAPSHOTS === 'true') {
    backfilledOrders = await backfillExistingOrderSnapshots(typedMenuItems);
  }

  await OrderModel.deleteMany({
    checkoutIdempotencyKey: /^demo-order-/,
  }).exec();

  const orders = Array.from({ length: DEMO_ORDER_COUNT }, (_, index) =>
    createDemoOrder({
      userId: demoCustomer._id,
      menuItems: typedMenuItems,
      menuVersion,
      index,
    }),
  );

  await OrderModel.insertMany(orders);

  console.log(
    `Seeded ${orders.length} demo orders. Backfilled ${backfilledOrders} existing orders.`,
  );

  await mongoose.disconnect();
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
