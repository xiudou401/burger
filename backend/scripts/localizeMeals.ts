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
    priceCents: 1200,
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    image: '/img/meals/2.png',
    name: 'Double Cheese Stack',
    description:
      'Two beef patties, double cheddar, burger sauce, and house pickles.',
    priceCents: 2000,
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    image: '/img/meals/3.png',
    name: 'Sydney Club Burger',
    description: 'Double beef, lettuce, onion, cheese, and a tangy club sauce.',
    priceCents: 2400,
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    image: '/img/meals/4.png',
    name: 'Spicy Chicken Burger',
    description: 'Crispy chicken thigh, chilli mayo, lettuce, and toasted bun.',
    priceCents: 2100,
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    image: '/img/meals/5.png',
    name: 'Grilled Chicken Burger',
    description: 'Grilled chicken, lettuce, smoky BBQ glaze, and creamy mayo.',
    priceCents: 2200,
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    image: '/img/meals/6.png',
    name: 'Crispy Chicken Classic',
    description: 'Golden chicken fillet, crisp lettuce, and light mayo.',
    priceCents: 1400,
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    image: '/img/meals/7.png',
    name: 'Cheeseburger',
    description: 'Beef patty, cheddar, tomato relish, mustard, and pickles.',
    priceCents: 1200,
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    image: '/img/meals/8.png',
    name: 'Loaded Club Fries',
    description:
      'Crispy fries topped with melted cheese, smoky bacon, and spring onion.',
    priceCents: 900,
    category: 'side',
    isFeatured: true,
    isAvailable: true,
  },
  {
    image: '/img/meals/9.png',
    name: 'Golden Onion Rings',
    description:
      'Crunchy battered onion rings served with a creamy house dipping sauce.',
    priceCents: 800,
    category: 'side',
    isFeatured: false,
    isAvailable: true,
  },
  {
    image: '/img/meals/10.png',
    name: 'House Lemonade',
    description:
      'Cold sparkling lemonade with fresh lemon, ice, and a bright citrus finish.',
    priceCents: 600,
    category: 'drink',
    isFeatured: false,
    isAvailable: true,
  },
  {
    image: '/img/meals/11.png',
    name: 'Vanilla Thickshake',
    description:
      'Creamy vanilla shake finished with whipped cream for a classic burger shop treat.',
    priceCents: 850,
    category: 'drink',
    isFeatured: true,
    isAvailable: true,
  },
  {
    image: '/img/meals/12.png',
    name: 'Warm Chocolate Brownie',
    description:
      'Rich chocolate brownie served with vanilla ice cream and chocolate sauce.',
    priceCents: 950,
    category: 'dessert',
    isFeatured: true,
    isAvailable: true,
  },
  {
    image: '/img/meals/13.png',
    name: 'Vanilla Soft Serve',
    description:
      'Classic soft serve in a takeaway cup. Temporarily sold out during dinner rush.',
    priceCents: 650,
    category: 'dessert',
    isFeatured: false,
    isAvailable: false,
  },
  {
    image: '/img/meals/14.png',
    name: 'Classic Burger Combo',
    description:
      'Harbour Classic Burger with crispy fries and a cold drink for one.',
    priceCents: 1990,
    category: 'combo',
    isFeatured: true,
    isAvailable: true,
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
            priceCents: meal.priceCents,
            category: meal.category,
            isAvailable: meal.isAvailable,
            isFeatured: meal.isFeatured,
          },
        },
        { upsert: true },
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
  const upserted = results.reduce(
    (sum, result) => sum + result.upsertedCount,
    0,
  );

  await mongoose.disconnect();

  console.log(`Meals matched: ${matched}`);
  console.log(`Meals modified: ${modified}`);
  console.log(`Meals inserted: ${upserted}`);
};

localizeMeals().catch((err) => {
  console.error(err);
  process.exit(1);
});
