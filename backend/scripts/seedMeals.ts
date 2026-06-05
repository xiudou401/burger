import { MealModel } from '../src/models/meal.model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const meals = [
  {
    name: 'Harbour Classic Burger',
    description:
      'Grass-fed beef, pickles, onion, tomato relish, and soft milk bun.',
    priceCents: 1200,
    image: '/img/meals/1.png',
  },
  {
    name: 'Double Cheese Stack',
    description:
      'Two beef patties, double cheddar, burger sauce, and house pickles.',
    priceCents: 2000,
    image: '/img/meals/2.png',
  },
  {
    name: 'Sydney Club Burger',
    description: 'Double beef, lettuce, onion, cheese, and a tangy club sauce.',
    priceCents: 2400,
    image: '/img/meals/3.png',
  },
  {
    name: 'Spicy Chicken Burger',
    description: 'Crispy chicken thigh, chilli mayo, lettuce, and toasted bun.',
    priceCents: 2100,
    image: '/img/meals/4.png',
  },
  {
    name: 'Grilled Chicken Burger',
    description: 'Grilled chicken, lettuce, smoky BBQ glaze, and creamy mayo.',
    priceCents: 2200,
    image: '/img/meals/5.png',
  },
  {
    name: 'Crispy Chicken Classic',
    description: 'Golden chicken fillet, crisp lettuce, and light mayo.',
    priceCents: 1400,
    image: '/img/meals/6.png',
  },
  {
    name: 'Cheeseburger',
    description: 'Beef patty, cheddar, tomato relish, mustard, and pickles.',
    priceCents: 1200,
    image: '/img/meals/7.png',
  },
];

const seedMeals = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed database in production');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log('MongoDB connected');

  await MealModel.deleteMany();
  console.log('Old meals removed');

  await MealModel.insertMany(meals);
  console.log('Meals seeded successfully');

  await mongoose.disconnect();
  process.exit(0);
};

seedMeals().catch((err) => {
  console.error(err);
  process.exit(1);
});
