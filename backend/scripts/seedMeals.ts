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
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Double Cheese Stack',
    description:
      'Two beef patties, double cheddar, burger sauce, and house pickles.',
    priceCents: 2000,
    image: '/img/meals/2.png',
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Sydney Club Burger',
    description: 'Double beef, lettuce, onion, cheese, and a tangy club sauce.',
    priceCents: 2400,
    image: '/img/meals/3.png',
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Spicy Chicken Burger',
    description: 'Crispy chicken thigh, chilli mayo, lettuce, and toasted bun.',
    priceCents: 2100,
    image: '/img/meals/4.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Grilled Chicken Burger',
    description: 'Grilled chicken, lettuce, smoky BBQ glaze, and creamy mayo.',
    priceCents: 2200,
    image: '/img/meals/5.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Crispy Chicken Classic',
    description: 'Golden chicken fillet, crisp lettuce, and light mayo.',
    priceCents: 1400,
    image: '/img/meals/6.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Cheeseburger',
    description: 'Beef patty, cheddar, tomato relish, mustard, and pickles.',
    priceCents: 1200,
    image: '/img/meals/7.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Loaded Club Fries',
    description:
      'Crispy fries topped with melted cheese, smoky bacon, and spring onion.',
    priceCents: 900,
    image: '/img/meals/8.png',
    category: 'side',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Golden Onion Rings',
    description:
      'Crunchy battered onion rings served with a creamy house dipping sauce.',
    priceCents: 800,
    image: '/img/meals/9.png',
    category: 'side',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'House Lemonade',
    description:
      'Cold sparkling lemonade with fresh lemon, ice, and a bright citrus finish.',
    priceCents: 600,
    image: '/img/meals/10.png',
    category: 'drink',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Vanilla Thickshake',
    description:
      'Creamy vanilla shake finished with whipped cream for a classic burger shop treat.',
    priceCents: 850,
    image: '/img/meals/11.png',
    category: 'drink',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Warm Chocolate Brownie',
    description:
      'Rich chocolate brownie served with vanilla ice cream and chocolate sauce.',
    priceCents: 950,
    image: '/img/meals/12.png',
    category: 'dessert',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Vanilla Soft Serve',
    description:
      'Classic soft serve in a takeaway cup. Temporarily sold out during dinner rush.',
    priceCents: 650,
    image: '/img/meals/13.png',
    category: 'dessert',
    isFeatured: false,
    isAvailable: false,
  },
  {
    name: 'Classic Burger Combo',
    description:
      'Harbour Classic Burger with crispy fries and a cold drink for one.',
    priceCents: 1990,
    image: '/img/meals/14.png',
    category: 'combo',
    isFeatured: true,
    isAvailable: true,
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
