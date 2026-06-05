import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MealModel } from '../src/models/meal.model';
import { MenuModel } from '../src/models/menu.model';

dotenv.config();

const meals = [
  {
    image: '/img/meals/1.png',
    name: 'Harbour Classic Burger',
    description:
      'Grass-fed beef, pickles, onion, tomato relish, and soft milk bun.',
    price: 12,
  },
  {
    image: '/img/meals/2.png',
    name: 'Double Cheese Stack',
    description:
      'Two beef patties, double cheddar, burger sauce, and house pickles.',
    price: 20,
  },
  {
    image: '/img/meals/3.png',
    name: 'Sydney Club Burger',
    description:
      'Double beef, lettuce, onion, cheese, and a tangy club sauce.',
    price: 24,
  },
  {
    image: '/img/meals/4.png',
    name: 'Spicy Chicken Burger',
    description:
      'Crispy chicken thigh, chilli mayo, lettuce, and toasted bun.',
    price: 21,
  },
  {
    image: '/img/meals/5.png',
    name: 'Grilled Chicken Burger',
    description:
      'Grilled chicken, lettuce, smoky BBQ glaze, and creamy mayo.',
    price: 22,
  },
  {
    image: '/img/meals/6.png',
    name: 'Crispy Chicken Classic',
    description:
      'Golden chicken fillet, crisp lettuce, and light mayo.',
    price: 14,
  },
  {
    image: '/img/meals/7.png',
    name: 'Cheeseburger',
    description:
      'Beef patty, cheddar, tomato relish, mustard, and pickles.',
    price: 12,
  },
];

const localizeMeals = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const results = await Promise.all(
    meals.map((meal) =>
      MealModel.collection.updateOne(
        { image: meal.image },
        {
          $set: {
            name: meal.name,
            description: meal.description,
            price: meal.price,
          },
        },
      ),
    ),
  );

  await MenuModel.updateOne(
    { _id: 'main' },
    { $set: { version: Date.now(), updatedAt: new Date() } },
    { upsert: true },
  );

  const matched = results.reduce((sum, result) => sum + result.matchedCount, 0);
  const modified = results.reduce(
    (sum, result) => sum + result.modifiedCount,
    0,
  );

  await mongoose.disconnect();

  console.log(`Meals matched: ${matched}`);
  console.log(`Meals modified: ${modified}`);
};

localizeMeals().catch((err) => {
  console.error(err);
  process.exit(1);
});
