import { MenuItemModel } from '../src/models/menu-item.model';
import { bumpMenuVersion } from '../src/services/menu.service';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const menuItems = [
  {
    name: 'Old School Cheese Burger',
    description:
      'Smashed beef patty, American cheese, pickles, red onion, lettuce, tomato, pink sauce and BBQ sauce.',
    priceCents: 1490,
    image: '/img/meals/1.png',
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Double Smash Royale',
    description:
      'Two crispy-edged beef patties, double American cheese, pickles, red onion, mustard and house burger sauce.',
    priceCents: 2290,
    image: '/img/meals/2.png',
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Smoky Bacon & Cheese',
    description:
      'Beef patty, American cheese, streaky smoked bacon, lettuce, tomato, pickles, BBQ sauce and pink sauce.',
    priceCents: 1990,
    image: '/img/meals/3.png',
    category: 'burger',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Lemon & Herb Chicken Burger',
    description:
      'Flame-grilled chicken breast, lettuce, tomato, red onion, pickles, aioli and pink sauce.',
    priceCents: 1790,
    image: '/img/meals/4.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Southern Crispy Chicken Burger',
    description:
      'Double-crunch crispy chicken, cheese sauce, lettuce, red onion, pickles, aioli and chipotle pink sauce.',
    priceCents: 1890,
    image: '/img/meals/5.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Aussie Burger',
    description:
      'Beef patty, American cheese, bacon, fried egg, beetroot, pineapple, lettuce, tomato, pickles and BBQ sauce.',
    priceCents: 2190,
    image: '/img/meals/6.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Mushroom Halloumi Burger',
    description:
      'Grilled portobello mushroom, halloumi, lettuce, tomato, onion rings, pickles, aioli and herb sauce.',
    priceCents: 1990,
    image: '/img/meals/7.png',
    category: 'burger',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Cheesy Loaded Chips',
    description:
      'Famous chips topped with cheese sauce, chilli mayo, smoky bacon and spring onion.',
    priceCents: 1590,
    image: '/img/meals/8.png',
    category: 'side',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Golden Onion Rings',
    description:
      'Crispy onion rings served with creamy aioli for dipping.',
    priceCents: 1090,
    image: '/img/meals/9.png',
    category: 'side',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'House Lemonade',
    description:
      'Cold sparkling lemonade with fresh lemon, ice and a bright citrus finish.',
    priceCents: 650,
    image: '/img/meals/10.png',
    category: 'drink',
    isFeatured: false,
    isAvailable: true,
  },
  {
    name: 'Vanilla Malt Thickshake',
    description:
      'Creamy vanilla malt shake finished thick and cold for a classic burger shop treat.',
    priceCents: 1090,
    image: '/img/meals/11.png',
    category: 'drink',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Warm Chocolate Brownie',
    description:
      'Rich chocolate brownie served with vanilla ice cream and chocolate sauce.',
    priceCents: 990,
    image: '/img/meals/12.png',
    category: 'dessert',
    isFeatured: true,
    isAvailable: true,
  },
  {
    name: 'Vanilla Soft Serve',
    description:
      'Classic vanilla soft serve in a takeaway cup. Temporarily sold out during dinner rush.',
    priceCents: 650,
    image: '/img/meals/13.png',
    category: 'dessert',
    isFeatured: false,
    isAvailable: false,
  },
  {
    name: 'Old School Combo',
    description:
      'Old School Cheese Burger with famous chips and a cold soft drink.',
    priceCents: 2490,
    image: '/img/meals/14.png',
    category: 'combo',
    isFeatured: true,
    isAvailable: true,
  },
];

const seedMenuItems = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed database in production');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log('MongoDB connected');

  await MenuItemModel.deleteMany();
  console.log('Old menu items removed');

  await MenuItemModel.insertMany(menuItems);
  console.log('Menu items seeded successfully');

  await bumpMenuVersion();
  console.log('Menu version bumped');

  await mongoose.disconnect();
  process.exit(0);
};

seedMenuItems().catch((err) => {
  console.error(err);
  process.exit(1);
});
