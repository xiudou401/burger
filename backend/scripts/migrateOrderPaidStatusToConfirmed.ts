import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const migrateOrderPaidStatusToConfirmed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  if (process.env.ALLOW_ORDER_CONFIRMED_STATUS_MIGRATION !== 'true') {
    throw new Error(
      'Refusing to migrate orders. Set ALLOW_ORDER_CONFIRMED_STATUS_MIGRATION=true to confirm this write operation.',
    );
  }

  await mongoose.connect(process.env.MONGO_URI);

  const orders = mongoose.connection.collection('orders');
  const beforePaidStatusOrders = await orders.countDocuments({
    status: 'paid',
  });
  const beforeConfirmedStatusOrders = await orders.countDocuments({
    status: 'confirmed',
  });

  const result = await orders.updateMany(
    { status: 'paid' },
    { $set: { status: 'confirmed' } },
  );

  const afterPaidStatusOrders = await orders.countDocuments({
    status: 'paid',
  });
  const afterConfirmedStatusOrders = await orders.countDocuments({
    status: 'confirmed',
  });

  await mongoose.disconnect();

  console.log(`Paid status orders before: ${beforePaidStatusOrders}`);
  console.log(`Confirmed status orders before: ${beforeConfirmedStatusOrders}`);
  console.log(`Orders matched: ${result.matchedCount}`);
  console.log(`Orders migrated: ${result.modifiedCount}`);
  console.log(`Paid status orders after: ${afterPaidStatusOrders}`);
  console.log(`Confirmed status orders after: ${afterConfirmedStatusOrders}`);
};

migrateOrderPaidStatusToConfirmed().catch((error) => {
  console.error(error);
  process.exit(1);
});
