import type { Quote } from '../../../types/cart';
import {
  calculateEstimatedTotalCents,
  getQuoteUnitPriceChanges,
} from './quote-utils';

const quote: Quote = {
  menuVersion: 4,
  menuItems: [
    {
      id: 'burger',
      name: 'Classic Burger',
      description: 'Beef burger',
      priceCents: 1200,
      category: 'burger',
      isAvailable: true,
      quantity: 1,
      subtotalCents: 1200,
      image: '/img/burger.png',
    },
    {
      id: 'fries',
      name: 'Fries',
      description: 'Crispy fries',
      priceCents: 500,
      category: 'side',
      isAvailable: true,
      quantity: 1,
      subtotalCents: 500,
      image: '/img/fries.png',
    },
  ],
  ts: 1,
};

describe('calculateEstimatedTotalCents', () => {
  it('uses current cart quantities with validated prices', () => {
    expect(
      calculateEstimatedTotalCents(quote, [
        { id: 'burger', quantity: 2 },
        { id: 'fries', quantity: 3 },
      ]),
    ).toBe(3900);
  });

  it('ignores quoted menu items that are no longer in the cart', () => {
    expect(
      calculateEstimatedTotalCents(quote, [{ id: 'burger', quantity: 1 }]),
    ).toBe(1200);
  });

  it('returns zero without a quote', () => {
    expect(
      calculateEstimatedTotalCents(null, [{ id: 'burger', quantity: 2 }]),
    ).toBe(0);
  });
});

describe('getQuoteUnitPriceChanges', () => {
  it('returns an empty list without a previous quote', () => {
    expect(getQuoteUnitPriceChanges(null, quote)).toEqual([]);
  });

  it('returns changed items with their new prices', () => {
    expect(
      getQuoteUnitPriceChanges(quote, {
        ...quote,
        menuItems: quote.menuItems.map((menuItem) =>
          menuItem.id === 'burger' || menuItem.id === 'fries'
            ? { ...menuItem, priceCents: menuItem.priceCents + 100 }
            : menuItem,
        ),
      }),
    ).toEqual([
      { name: 'Classic Burger', priceCents: 1300 },
      { name: 'Fries', priceCents: 600 },
    ]);
  });

  it('returns an empty list when only quantities change', () => {
    expect(
      getQuoteUnitPriceChanges(quote, {
        ...quote,
        menuItems: quote.menuItems.map((menuItem) => ({
          ...menuItem,
          quantity: menuItem.quantity + 1,
        })),
      }),
    ).toEqual([]);
  });

  it('ignores new items that were not in the previous quote', () => {
    expect(
      getQuoteUnitPriceChanges(quote, {
        ...quote,
        menuItems: [
          ...quote.menuItems,
          {
            id: 'shake',
            name: 'Shake',
            description: 'Vanilla shake',
            priceCents: 800,
            category: 'drink',
            isAvailable: true,
            quantity: 1,
            subtotalCents: 800,
            image: '/img/shake.png',
          },
        ],
      }),
    ).toEqual([]);
  });
});
