import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const toCents = (value: unknown) => Math.round(Number(value) * 100);

const migrateMoneyToCents = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const meals = mongoose.connection.collection('meals');
  const orders = mongoose.connection.collection('orders');

  let migratedMeals = 0;
  let migratedOrders = 0;

  for await (const meal of meals.find({ price: { $exists: true } })) {
    await meals.updateOne(
      { _id: meal._id },
      {
        $set: { priceCents: meal.priceCents ?? toCents(meal.price) },
        $unset: { price: '' },
      },
    );
    migratedMeals += 1;
  }

  for await (const order of orders.find({
    $or: [
      { total: { $exists: true } },
      { 'items.price': { $exists: true } },
      { 'payment.amount': { $exists: true } },
    ],
  })) {
    const items = Array.isArray(order.items)
      ? order.items.map(({ price, subtotal, ...item }) => ({
          ...item,
          priceCents: item.priceCents ?? toCents(price),
          subtotalCents: item.subtotalCents ?? toCents(subtotal),
        }))
      : [];
    const payment = order.payment
      ? {
          ...order.payment,
          amountCents:
            order.payment.amountCents ?? toCents(order.payment.amount),
        }
      : order.payment;

    if (payment) {
      delete payment.amount;
    }

    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          items,
          totalCents: order.totalCents ?? toCents(order.total),
          ...(payment ? { payment } : {}),
        },
        $unset: { total: '' },
      },
    );
    migratedOrders += 1;
  }

  await mongoose.disconnect();

  console.log(`Meals migrated: ${migratedMeals}`);
  console.log(`Orders migrated: ${migratedOrders}`);
};

migrateMoneyToCents().catch((error) => {
  console.error(error);
  process.exit(1);
});
