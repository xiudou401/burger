import '../src/config/env';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import { MenuItemModel, type MenuItem } from '../src/models/menu-item.model';
import {
  OrderModel,
  type OrderStatus,
  type PaymentStatus,
} from '../src/models/order.model';
import { UserModel } from '../src/models/user.model';
import { getMenuVersion } from '../src/services/menu.service';

type DemoMenuItem = MenuItem & { _id: mongoose.Types.ObjectId };

const DAY_MS = 24 * 60 * 60 * 1000;

const pickMenuItem = (items: DemoMenuItem[], name: string) => {
  const item = items.find((menuItem) => menuItem.name === name);

  if (!item) {
    throw new Error(`Menu item not found: ${name}`);
  }

  return item;
};

const buildOrderItem = (menuItem: DemoMenuItem, quantity: number) => ({
  menuItemId: menuItem._id,
  nameAtPurchase: menuItem.name,
  imageAtPurchase: menuItem.image,
  priceCentsAtPurchase: menuItem.priceCents,
  quantity,
  subtotalCents: menuItem.priceCents * quantity,
});

const createDemoOrder = ({
  userId,
  menuItems,
  menuVersion,
  index,
  daysAgo,
  itemNames,
  status,
  paymentStatus,
}: {
  userId: mongoose.Types.ObjectId;
  menuItems: DemoMenuItem[];
  menuVersion: number;
  index: number;
  daysAgo: number;
  itemNames: string[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) => {
  const createdAt = new Date(Date.now() - daysAgo * DAY_MS);
  createdAt.setHours(11 + (index % 10), (index * 7) % 60, 0, 0);

  const items = itemNames.map((name) =>
    buildOrderItem(pickMenuItem(menuItems, name), 1),
  );
  const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
  const isPaid = paymentStatus === 'paid';

  return {
    userId,
    items,
    totalCents,
    menuVersion,
    checkoutIdempotencyKey: `demo-order-${index}`,
    checkoutUrl: `https://checkout.stripe.test/demo-order-${index}`,
    status,
    payment: {
      provider: 'stripe' as const,
      providerPaymentId: `cs_demo_${index}`,
      status: paymentStatus,
      amountCents: totalCents,
      currency: 'aud',
      paidAt: isPaid ? createdAt : undefined,
    },
    createdAt,
    updatedAt: new Date(createdAt.getTime() + (isPaid ? 18 : 3) * 60_000),
  };
};

const orderPatterns = [
  ['Old School Cheese Burger', 'Crispy Fries', 'Cold Soft Drink'],
  ['Old School Cheese Burger', 'Crispy Fries'],
  ['Old School Combo'],
  ['Southern Crispy Chicken Burger', 'House Lemonade'],
  ['Double Smash Royale', 'Golden Onion Rings', 'Cold Soft Drink'],
  ['Smoky Bacon & Cheese', 'Crispy Fries'],
  ['Lemon & Herb Chicken Burger', 'House Lemonade'],
  ['Aussie Burger', 'Cheesy Loaded Chips'],
  ['Mushroom Halloumi Burger', 'Golden Onion Rings'],
  ['Warm Chocolate Brownie'],
  ['Vanilla Malt Thickshake'],
];

const getDemoStatus = (index: number) => {
  if (index % 17 === 0) {
    return {
      status: 'cancelled' as const,
      paymentStatus: 'cancelled' as const,
    };
  }

  if (index % 13 === 0) {
    return {
      status: 'pending_payment' as const,
      paymentStatus: 'failed' as const,
    };
  }

  const paidStatuses: OrderStatus[] = [
    'paid',
    'preparing',
    'ready',
    'completed',
  ];

  return {
    status: paidStatuses[index % paidStatuses.length],
    paymentStatus: 'paid' as const,
  };
};

(async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed demo orders in production');
  }

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

  await OrderModel.deleteMany({
    checkoutIdempotencyKey: /^demo-order-/,
  }).exec();

  const orders = Array.from({ length: 42 }, (_, index) => {
    const pattern = orderPatterns[index % orderPatterns.length];
    const { status, paymentStatus } = getDemoStatus(index);

    return createDemoOrder({
      userId: demoCustomer._id,
      menuItems: menuItems as DemoMenuItem[],
      menuVersion,
      index,
      daysAgo: index % 30,
      itemNames: pattern,
      status,
      paymentStatus,
    });
  });

  await OrderModel.insertMany(orders);

  console.log(`Seeded ${orders.length} demo orders`);

  await mongoose.disconnect();
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
