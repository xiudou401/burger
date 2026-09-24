import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const migrateOrderMealIdToMenuItemId = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  if (process.env.ALLOW_ORDER_MENU_ITEM_ID_MIGRATION !== 'true') {
    throw new Error(
      'Refusing to migrate orders. Set ALLOW_ORDER_MENU_ITEM_ID_MIGRATION=true to confirm this write operation.',
    );
  }

  await mongoose.connect(process.env.MONGO_URI);

  const orders = mongoose.connection.collection('orders');
  let scannedOrders = 0;
  let migratedOrders = 0;
  let migratedItems = 0;

  for await (const order of orders.find({
    'items.mealId': { $exists: true },
  })) {
    scannedOrders += 1;

    if (!Array.isArray(order.items)) {
      continue;
    }

    let changed = false;
    const items = order.items.map((item) => {
      const nextItem = { ...item };

      if (nextItem.menuItemId === undefined && nextItem.mealId !== undefined) {
        nextItem.menuItemId = nextItem.mealId;
        migratedItems += 1;
        changed = true;
      }

      if (nextItem.mealId !== undefined) {
        delete nextItem.mealId;
        changed = true;
      }

      return nextItem;
    });

    if (!changed) {
      continue;
    }

    await orders.updateOne(
      { _id: order._id },
      {
        $set: { items },
      },
    );
    migratedOrders += 1;
  }

  await mongoose.disconnect();

  console.log(`Orders scanned: ${scannedOrders}`);
  console.log(`Orders migrated: ${migratedOrders}`);
  console.log(`Items migrated: ${migratedItems}`);
};

migrateOrderMealIdToMenuItemId().catch((error) => {
  console.error(error);
  process.exit(1);
});
