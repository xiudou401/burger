import { Types } from 'mongoose';
import {
  MenuItemModel,
  type MenuItemCategory,
  type MenuItemServingSize,
} from '../src/models/menu-item.model';
import { bumpMenuVersion } from '../src/services/menu.service';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface SeedMenuItem {
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: MenuItemCategory;
  isAvailable: boolean;
  tags: string[];
  dietary: string[];
  allergens: string[];
  spiceLevel: 0 | 1 | 2 | 3;
  servingSize: MenuItemServingSize;
  pairings?: string[];
  comboItems?: string[];
}

const menuItems: SeedMenuItem[] = [
  {
    name: 'Old School Cheese Burger',
    description:
      'Smashed beef patty, American cheese, pickles, red onion, lettuce, tomato, pink sauce and BBQ sauce.',
    priceCents: 1490,
    image: '/img/meals/ai/beef-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'classic', 'cheese', 'popular'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'Cold Soft Drink', 'House Lemonade'],
  },
  {
    name: 'Double Smash Royale',
    description:
      'Two crispy-edged beef patties, double American cheese, pickles, red onion, mustard and house burger sauce.',
    priceCents: 2290,
    image: '/img/meals/2.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'double', 'filling', 'premium'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'filling',
    pairings: ['Loaded Bacon Fries', 'Vanilla Malt Thickshake'],
  },
  {
    name: 'Smoky Bacon & Cheese',
    description:
      'Beef patty, American cheese, streaky smoked bacon, lettuce, tomato, pickles, BBQ sauce and pink sauce.',
    priceCents: 1990,
    image: '/img/meals/3.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'bacon', 'smoky', 'cheese'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Golden Onion Rings', 'Cold Soft Drink'],
  },
  {
    name: 'Lemon & Herb Chicken Burger',
    description:
      'Flame-grilled chicken breast, lettuce, tomato, red onion, pickles, aioli and herb sauce.',
    priceCents: 1790,
    image: '/img/meals/4.png',
    category: 'burger',
    isAvailable: true,
    tags: ['chicken', 'grilled', 'fresh', 'lighter'],
    dietary: ['halal-friendly'],
    allergens: ['gluten', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Sweet Potato Fries', 'Iced Peach Tea'],
  },
  {
    name: 'Southern Crispy Chicken Burger',
    description:
      'Double-crunch crispy chicken, cheese sauce, lettuce, red onion, pickles, aioli and chipotle pink sauce.',
    priceCents: 1890,
    image: '/img/meals/ai/chicken-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['chicken', 'crispy', 'chipotle', 'popular'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 1,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'House Lemonade'],
  },
  {
    name: 'Hot Honey Chicken Burger',
    description:
      'Crispy chicken, hot honey glaze, slaw, pickles, jalapeno mayo and American cheese.',
    priceCents: 1990,
    image: '/img/meals/ai/hot-honey-chicken-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['chicken', 'spicy', 'sweet-heat', 'crispy'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 2,
    servingSize: 'regular',
    pairings: ['Ranch Slaw Cup', 'Mango Passion Soda'],
  },
  {
    name: 'Aussie Burger',
    description:
      'Beef patty, American cheese, bacon, fried egg, beetroot, pineapple, lettuce, tomato, pickles and BBQ sauce.',
    priceCents: 2190,
    image: '/img/meals/ai/aussie-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'aussie', 'bacon', 'egg'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'filling',
    pairings: ['Golden Onion Rings', 'Bundaberg Ginger Beer'],
  },
  {
    name: 'Mushroom Halloumi Burger',
    description:
      'Grilled portobello mushroom, halloumi, lettuce, tomato, onion rings, pickles, aioli and herb sauce.',
    priceCents: 1990,
    image: '/img/meals/ai/plant-based-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['vegetarian', 'mushroom', 'halloumi', 'grilled'],
    dietary: ['vegetarian'],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Sweet Potato Fries', 'House Lemonade'],
  },
  {
    name: 'Plant-Based Classic',
    description:
      'Plant-based patty, vegan cheese, lettuce, tomato, pickles, onion, ketchup and vegan aioli.',
    priceCents: 2090,
    image: '/img/meals/ai/veggie-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['plant-based', 'vegan', 'classic'],
    dietary: ['vegan', 'vegetarian'],
    allergens: ['gluten'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'Mango Passion Soda'],
  },
  {
    name: 'Kids Mini Cheeseburger',
    description:
      'Small beef patty, American cheese, ketchup and pickles on a soft milk bun.',
    priceCents: 990,
    image: '/img/meals/ai/kids-cheeseburger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['kids', 'beef', 'cheese', 'budget'],
    dietary: [],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'light',
    pairings: ['Crispy Fries', 'Cold Soft Drink'],
  },
  {
    name: 'Crispy Fries',
    description: 'Golden shoestring fries cooked crisp and lightly salted.',
    priceCents: 790,
    image: '/img/meals/15.png',
    category: 'side',
    isAvailable: true,
    tags: ['fries', 'classic', 'shareable', 'budget'],
    dietary: ['vegan', 'vegetarian'],
    allergens: [],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Old School Cheese Burger', 'Southern Crispy Chicken Burger'],
  },
  {
    name: 'Loaded Bacon Fries',
    description:
      'Crispy fries topped with cheese sauce, smoky bacon, spring onion and burger sauce.',
    priceCents: 1590,
    image: '/img/meals/ai/loaded-fries.png',
    category: 'side',
    isAvailable: true,
    tags: ['fries', 'loaded', 'bacon', 'shareable'],
    dietary: [],
    allergens: ['dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'share',
    pairings: ['Double Smash Royale', 'Cold Soft Drink'],
  },
  {
    name: 'Golden Onion Rings',
    description: 'Crispy onion rings served with creamy aioli for dipping.',
    priceCents: 1090,
    image: '/img/meals/9.png',
    category: 'side',
    isAvailable: true,
    tags: ['onion-rings', 'crispy', 'shareable'],
    dietary: ['vegetarian'],
    allergens: ['gluten', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Smoky Bacon & Cheese', 'Aussie Burger'],
  },
  {
    name: 'Sweet Potato Fries',
    description: 'Sweet potato fries with sea salt and chipotle mayo.',
    priceCents: 1190,
    image: '/img/meals/ai/sweet-potato-fries.png',
    category: 'side',
    isAvailable: true,
    tags: ['sweet-potato', 'fries', 'vegetarian'],
    dietary: ['vegetarian'],
    allergens: ['egg'],
    spiceLevel: 1,
    servingSize: 'regular',
    pairings: ['Lemon & Herb Chicken Burger', 'Mushroom Halloumi Burger'],
  },
  {
    name: 'Ranch Slaw Cup',
    description:
      'Cabbage, carrot, herbs and ranch dressing in a crisp side cup.',
    priceCents: 690,
    image: '/img/meals/ai/ranch-slaw.png',
    category: 'side',
    isAvailable: true,
    tags: ['slaw', 'fresh', 'lighter'],
    dietary: ['vegetarian'],
    allergens: ['dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'light',
    pairings: ['Hot Honey Chicken Burger', 'Plant-Based Classic'],
  },
  {
    name: 'Mozzarella Sticks',
    description: 'Crumbed mozzarella sticks with warm marinara sauce.',
    priceCents: 1290,
    image: '/img/meals/ai/mozzarella-sticks.png',
    category: 'side',
    isAvailable: true,
    tags: ['cheese', 'crispy', 'shareable'],
    dietary: ['vegetarian'],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'share',
    pairings: ['Old School Cheese Burger', 'House Lemonade'],
  },
  {
    name: 'House Lemonade',
    description:
      'Cold sparkling lemonade with fresh lemon, ice and a bright citrus finish.',
    priceCents: 650,
    image: '/img/meals/ai/house-lemonade.png',
    category: 'drink',
    isAvailable: true,
    tags: ['lemonade', 'sparkling', 'refreshing'],
    dietary: ['vegan', 'vegetarian'],
    allergens: [],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Old School Cheese Burger', 'Southern Crispy Chicken Burger'],
  },
  {
    name: 'Cold Soft Drink',
    description: 'Classic chilled cola-style soft drink served over ice.',
    priceCents: 550,
    image: '/img/meals/ai/ginger-beer.png',
    category: 'drink',
    isAvailable: true,
    tags: ['cola', 'classic', 'budget'],
    dietary: ['vegan', 'vegetarian'],
    allergens: [],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'Smoky Bacon & Cheese'],
  },
  {
    name: 'Vanilla Malt Thickshake',
    description:
      'Creamy vanilla malt shake finished thick and cold for a classic burger shop treat.',
    priceCents: 1090,
    image: '/img/meals/ai/vanilla-malt-thickshake.png',
    category: 'drink',
    isAvailable: true,
    tags: ['shake', 'vanilla', 'malt', 'dessert-drink'],
    dietary: ['vegetarian'],
    allergens: ['dairy', 'gluten'],
    spiceLevel: 0,
    servingSize: 'filling',
    pairings: ['Double Smash Royale', 'Warm Chocolate Brownie'],
  },
  {
    name: 'Chocolate Peanut Butter Shake',
    description:
      'Chocolate shake blended with peanut butter, malt and vanilla soft serve.',
    priceCents: 1190,
    image: '/img/meals/ai/chocolate-peanut-butter-shake.png',
    category: 'drink',
    isAvailable: true,
    tags: ['shake', 'chocolate', 'peanut-butter', 'rich'],
    dietary: ['vegetarian'],
    allergens: ['dairy', 'peanut', 'gluten'],
    spiceLevel: 0,
    servingSize: 'filling',
    pairings: ['Smoky Bacon & Cheese', 'Warm Chocolate Brownie'],
  },
  {
    name: 'Iced Peach Tea',
    description: 'Cold black tea with peach syrup, lemon and plenty of ice.',
    priceCents: 690,
    image: '/img/meals/ai/iced-peach-tea.png',
    category: 'drink',
    isAvailable: true,
    tags: ['tea', 'peach', 'refreshing'],
    dietary: ['vegan', 'vegetarian'],
    allergens: [],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Lemon & Herb Chicken Burger', 'Ranch Slaw Cup'],
  },
  {
    name: 'Mango Passion Soda',
    description: 'Sparkling mango and passionfruit soda with lime.',
    priceCents: 750,
    image: '/img/meals/ai/mango-passion-soda.png',
    category: 'drink',
    isAvailable: true,
    tags: ['mango', 'sparkling', 'tropical'],
    dietary: ['vegan', 'vegetarian'],
    allergens: [],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Hot Honey Chicken Burger', 'Plant-Based Classic'],
  },
  {
    name: 'Bundaberg Ginger Beer',
    description: 'Bottled ginger beer with a spicy ginger finish.',
    priceCents: 790,
    image: '/img/meals/ai/cold-drinks.png',
    category: 'drink',
    isAvailable: true,
    tags: ['ginger-beer', 'spiced', 'bottle'],
    dietary: ['vegan', 'vegetarian'],
    allergens: [],
    spiceLevel: 1,
    servingSize: 'regular',
    pairings: ['Aussie Burger', 'Golden Onion Rings'],
  },
  {
    name: 'Warm Chocolate Brownie',
    description:
      'Rich chocolate brownie served with vanilla ice cream and chocolate sauce.',
    priceCents: 990,
    image: '/img/meals/ai/chocolate-brownie.png',
    category: 'dessert',
    isAvailable: true,
    tags: ['chocolate', 'warm', 'rich'],
    dietary: ['vegetarian'],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Vanilla Malt Thickshake'],
  },
  {
    name: 'Vanilla Soft Serve',
    description: 'Classic vanilla soft serve in a takeaway cup.',
    priceCents: 650,
    image: '/img/meals/ai/vanilla-soft-serve.png',
    category: 'dessert',
    isAvailable: false,
    tags: ['soft-serve', 'vanilla', 'cold'],
    dietary: ['vegetarian'],
    allergens: ['dairy'],
    spiceLevel: 0,
    servingSize: 'light',
    pairings: ['Chocolate Peanut Butter Shake'],
  },
  {
    name: 'Salted Caramel Sundae',
    description:
      'Vanilla soft serve with salted caramel sauce and biscuit crumb.',
    priceCents: 890,
    image: '/img/meals/ai/dessert-platter.png',
    category: 'dessert',
    isAvailable: true,
    tags: ['sundae', 'caramel', 'cold'],
    dietary: ['vegetarian'],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Old School Cheese Burger'],
  },
  {
    name: 'Apple Pie Bites',
    description: 'Crisp apple pie bites dusted with cinnamon sugar.',
    priceCents: 790,
    image: '/img/meals/ai/apple-pie-bites.png',
    category: 'dessert',
    isAvailable: true,
    tags: ['apple', 'cinnamon', 'shareable'],
    dietary: ['vegetarian'],
    allergens: ['gluten'],
    spiceLevel: 0,
    servingSize: 'share',
    pairings: ['Iced Peach Tea'],
  },
  {
    name: 'Old School Combo',
    description:
      'Old School Cheese Burger with Crispy Fries and a Cold Soft Drink.',
    priceCents: 2490,
    image: '/img/meals/ai/combo-meal.png',
    category: 'combo',
    isAvailable: true,
    tags: ['combo', 'classic', 'value'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'filling',
    comboItems: ['Old School Cheese Burger', 'Crispy Fries', 'Cold Soft Drink'],
  },
  {
    name: 'Crispy Chicken Combo',
    description:
      'Southern Crispy Chicken Burger with Crispy Fries and House Lemonade.',
    priceCents: 2790,
    image: '/img/meals/ai/chicken-combo.png',
    category: 'combo',
    isAvailable: true,
    tags: ['combo', 'chicken', 'popular'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 1,
    servingSize: 'filling',
    comboItems: [
      'Southern Crispy Chicken Burger',
      'Crispy Fries',
      'House Lemonade',
    ],
  },
  {
    name: 'Veggie Combo',
    description:
      'Mushroom Halloumi Burger with Sweet Potato Fries and Iced Peach Tea.',
    priceCents: 2890,
    image: '/img/meals/ai/plant-based-combo.png',
    category: 'combo',
    isAvailable: true,
    tags: ['combo', 'vegetarian', 'fresh'],
    dietary: ['vegetarian'],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 1,
    servingSize: 'filling',
    comboItems: [
      'Mushroom Halloumi Burger',
      'Sweet Potato Fries',
      'Iced Peach Tea',
    ],
  },
  {
    name: 'Plant-Based Combo',
    description:
      'Plant-Based Classic with Crispy Fries and Mango Passion Soda.',
    priceCents: 2890,
    image: '/img/meals/ai/veggie-combo.png',
    category: 'combo',
    isAvailable: true,
    tags: ['combo', 'vegan', 'plant-based'],
    dietary: ['vegan', 'vegetarian'],
    allergens: ['gluten'],
    spiceLevel: 0,
    servingSize: 'filling',
    comboItems: ['Plant-Based Classic', 'Crispy Fries', 'Mango Passion Soda'],
  },
  {
    name: 'Family Burger Box',
    description:
      'Two Old School Cheese Burgers, two Kids Mini Cheeseburgers, two Crispy Fries and two Cold Soft Drinks.',
    priceCents: 5990,
    image: '/img/meals/ai/family-burger-box.png',
    category: 'combo',
    isAvailable: true,
    tags: ['combo', 'family', 'shareable', 'value'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'share',
    comboItems: [
      'Old School Cheese Burger',
      'Kids Mini Cheeseburger',
      'Crispy Fries',
      'Cold Soft Drink',
    ],
  },
];

const legacyMenuItems: SeedMenuItem[] = [
  {
    name: 'Cheeseburger',
    description: 'Classic beef cheeseburger with pickles and house sauce.',
    priceCents: 1200,
    image: '/img/meals/ai/classic-beef-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'cheese', 'classic', 'budget'],
    dietary: [],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'Cold Soft Drink'],
  },
  {
    name: 'Crispy Chicken Classic',
    description: 'Crispy chicken burger with lettuce, pickles and aioli.',
    priceCents: 1400,
    image: '/img/meals/5.png',
    category: 'burger',
    isAvailable: true,
    tags: ['chicken', 'crispy', 'classic', 'budget'],
    dietary: [],
    allergens: ['gluten', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'House Lemonade'],
  },
  {
    name: 'Double Cheese Stack',
    description: 'Double beef cheeseburger with extra American cheese.',
    priceCents: 2000,
    image: '/img/meals/ai/double-cheese-stack.png',
    category: 'burger',
    isAvailable: false,
    tags: ['beef', 'double', 'cheese', 'sold-out'],
    dietary: [],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'filling',
    pairings: ['Loaded Bacon Fries', 'Cold Soft Drink'],
  },
  {
    name: 'Grilled Chicken Burger',
    description: 'Grilled chicken burger with salad, pickles and aioli.',
    priceCents: 2200,
    image: '/img/meals/ai/grilled-chicken-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['chicken', 'grilled', 'lighter'],
    dietary: ['halal-friendly'],
    allergens: ['gluten', 'egg'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Ranch Slaw Cup', 'Iced Peach Tea'],
  },
  {
    name: 'Harbour Classic Burger',
    description: 'Beef burger with cheese, lettuce, tomato and harbour sauce.',
    priceCents: 1200,
    image: '/img/meals/1.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'classic', 'budget'],
    dietary: [],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Crispy Fries', 'Cold Soft Drink'],
  },
  {
    name: 'Spicy Chicken Burger',
    description: 'Crispy chicken burger with jalapeno mayo and spicy slaw.',
    priceCents: 2200,
    image: '/img/meals/ai/spicy-chicken-burger.png',
    category: 'burger',
    isAvailable: true,
    tags: ['chicken', 'spicy', 'crispy'],
    dietary: [],
    allergens: ['gluten', 'egg'],
    spiceLevel: 2,
    servingSize: 'regular',
    pairings: ['Sweet Potato Fries', 'Mango Passion Soda'],
  },
  {
    name: 'Sydney Club Burger',
    description: 'Premium beef burger with bacon, egg, cheese and club sauce.',
    priceCents: 2500,
    image: '/img/meals/6.png',
    category: 'burger',
    isAvailable: true,
    tags: ['beef', 'premium', 'bacon', 'egg'],
    dietary: [],
    allergens: ['gluten', 'dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'filling',
    pairings: ['Golden Onion Rings', 'Bundaberg Ginger Beer'],
  },
  {
    name: 'Classic Burger Combo',
    description: 'Classic burger with fries and a drink.',
    priceCents: 1990,
    image: '/img/meals/ai/classic-combo.png',
    category: 'combo',
    isAvailable: true,
    tags: ['combo', 'classic', 'value'],
    dietary: [],
    allergens: ['gluten', 'dairy'],
    spiceLevel: 0,
    servingSize: 'filling',
    comboItems: ['Cheeseburger', 'Crispy Fries', 'Cold Soft Drink'],
  },
  {
    name: 'Vanilla Thickshake',
    description: 'Cold vanilla thickshake with malted milk.',
    priceCents: 850,
    image: '/img/meals/11.png',
    category: 'drink',
    isAvailable: true,
    tags: ['shake', 'vanilla', 'malt'],
    dietary: ['vegetarian'],
    allergens: ['dairy', 'gluten'],
    spiceLevel: 0,
    servingSize: 'regular',
    pairings: ['Cheeseburger', 'Warm Chocolate Brownie'],
  },
  {
    name: 'Loaded Club Fries',
    description: 'Fries loaded with cheese sauce, bacon and club sauce.',
    priceCents: 900,
    image: '/img/meals/ai/loaded-club-fries.png',
    category: 'side',
    isAvailable: true,
    tags: ['fries', 'loaded', 'bacon'],
    dietary: [],
    allergens: ['dairy', 'egg'],
    spiceLevel: 0,
    servingSize: 'share',
    pairings: ['Sydney Club Burger', 'Cold Soft Drink'],
  },
];

const catalogItems = [...menuItems, ...legacyMenuItems];

const getLinkedIds = (
  itemsByName: Map<string, { _id: Types.ObjectId }>,
  names: string[] = [],
) =>
  names
    .map((name) => itemsByName.get(name)?._id)
    .filter((id): id is Types.ObjectId => id !== undefined);

const seedMenuItems = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed database in production');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log('MongoDB connected');

  if (process.env.ALLOW_MENU_SEED_RESET === 'true') {
    await MenuItemModel.deleteMany();
    console.log('Old menu items removed');
  }

  await MenuItemModel.bulkWrite(
    catalogItems.map((item) => ({
      updateOne: {
        filter: { name: item.name },
        update: {
          $set: {
            description: item.description,
            priceCents: item.priceCents,
            image: item.image,
            category: item.category,
            isAvailable: item.isAvailable,
            tags: item.tags,
            dietary: item.dietary,
            allergens: item.allergens,
            spiceLevel: item.spiceLevel,
            servingSize: item.servingSize,
          },
          $setOnInsert: {
            _id: new Types.ObjectId(),
          },
        },
        upsert: true,
      },
    })),
  );

  const seededMenuItems = await MenuItemModel.find({
    name: { $in: catalogItems.map((item) => item.name) },
  })
    .select({ _id: 1, name: 1 })
    .lean()
    .exec();
  const itemsByName = new Map(
    seededMenuItems.map((item) => [
      item.name,
      { _id: item._id as Types.ObjectId },
    ]),
  );

  await MenuItemModel.bulkWrite(
    catalogItems.map((item) => ({
      updateOne: {
        filter: { name: item.name },
        update: {
          $set: {
            pairingIds: getLinkedIds(itemsByName, item.pairings),
            comboItemIds: getLinkedIds(itemsByName, item.comboItems),
          },
        },
      },
    })),
  );

  console.log(`Menu catalog upserted: ${catalogItems.length} items`);

  await bumpMenuVersion();
  console.log('Menu version bumped');

  await mongoose.disconnect();
  process.exit(0);
};

seedMenuItems().catch((err) => {
  console.error(err);
  process.exit(1);
});
