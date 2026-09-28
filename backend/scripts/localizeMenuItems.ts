import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MenuItemModel } from '../src/models/menu-item.model';
import { bumpMenuVersion } from '../src/services/menu.service';

dotenv.config();

const menuItems = [
  {
    image: '/img/meals/ai/harbour-classic-burger.png',
    name: 'Harbour Classic Burger',
    description:
      'Grass-fed beef, pickles, onion, tomato relish, and soft milk bun.',
    priceCents: 1200,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/double-cheese-stack.png',
    name: 'Double Cheese Stack',
    description:
      'Two beef patties, double cheddar, burger sauce, and house pickles.',
    priceCents: 2000,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/sydney-club-burger.png',
    name: 'Sydney Club Burger',
    description: 'Double beef, lettuce, onion, cheese, and a tangy club sauce.',
    priceCents: 2400,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/spicy-chicken-burger.png',
    name: 'Spicy Chicken Burger',
    description: 'Crispy chicken thigh, chilli mayo, lettuce, and toasted bun.',
    priceCents: 2100,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/grilled-chicken-burger.png',
    name: 'Grilled Chicken Burger',
    description: 'Grilled chicken, lettuce, smoky BBQ glaze, and creamy mayo.',
    priceCents: 2200,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/crispy-chicken-classic.png',
    name: 'Crispy Chicken Classic',
    description: 'Golden chicken fillet, crisp lettuce, and light mayo.',
    priceCents: 1400,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/classic-beef-burger.png',
    name: 'Cheeseburger',
    description: 'Beef patty, cheddar, tomato relish, mustard, and pickles.',
    priceCents: 1200,
    category: 'burger',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/loaded-club-fries.png',
    name: 'Loaded Club Fries',
    description:
      'Crispy fries topped with melted cheese, smoky bacon, and spring onion.',
    priceCents: 900,
    category: 'side',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/golden-onion-rings.png',
    name: 'Golden Onion Rings',
    description:
      'Crunchy battered onion rings served with a creamy house dipping sauce.',
    priceCents: 800,
    category: 'side',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/crispy-fries.png',
    name: 'Crispy Fries',
    description: 'Golden shoestring fries cooked crisp and lightly salted.',
    priceCents: 700,
    category: 'side',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/house-lemonade.png',
    name: 'House Lemonade',
    description:
      'Cold sparkling lemonade with fresh lemon, ice, and a bright citrus finish.',
    priceCents: 600,
    category: 'drink',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/cold-drinks.png',
    name: 'Cold Soft Drink',
    description: 'Classic chilled cola-style soft drink served over ice.',
    priceCents: 500,
    category: 'drink',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/vanilla-thickshake.png',
    name: 'Vanilla Thickshake',
    description:
      'Creamy vanilla shake finished with whipped cream for a classic burger shop treat.',
    priceCents: 850,
    category: 'drink',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/chocolate-brownie.png',
    name: 'Warm Chocolate Brownie',
    description:
      'Rich chocolate brownie served with vanilla ice cream and chocolate sauce.',
    priceCents: 950,
    category: 'dessert',
    isAvailable: true,
  },
  {
    image: '/img/meals/ai/vanilla-soft-serve.png',
    name: 'Vanilla Soft Serve',
    description:
      'Classic soft serve in a takeaway cup. Temporarily sold out during dinner rush.',
    priceCents: 650,
    category: 'dessert',
    isAvailable: false,
  },
  {
    image: '/img/meals/ai/classic-combo.png',
    name: 'Classic Burger Combo',
    description:
      'Harbour Classic Burger with Crispy Fries and a Cold Soft Drink for one.',
    priceCents: 1990,
    category: 'combo',
    isAvailable: true,
  },
];

const localizeMenuItems = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const results = await Promise.all(
    menuItems.map((menuItem) =>
      MenuItemModel.collection.updateOne(
        { image: menuItem.image },
        {
          $set: {
            name: menuItem.name,
            description: menuItem.description,
            priceCents: menuItem.priceCents,
            category: menuItem.category,
            isAvailable: menuItem.isAvailable,
          },
        },
        { upsert: true },
      ),
    ),
  );

  await bumpMenuVersion();

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

  console.log(`Menu items matched: ${matched}`);
  console.log(`Menu items modified: ${modified}`);
  console.log(`Menu items inserted: ${upserted}`);
};

localizeMenuItems().catch((err) => {
  console.error(err);
  process.exit(1);
});
