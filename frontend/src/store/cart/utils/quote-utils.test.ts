import type { Quote } from '../../../types/cart';
import {
  calculateQuantityAdjustedTotalCents,
  getDisplayTotalCents,
  getQuoteUnitPriceChanges,
} from './quote-utils';

const quote: Quote = {
  menuVersion: 4,
  totalCents: 1700,
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

describe('getDisplayTotalCents', () => {
  it('uses the backend quote total when the quote matches the current cart', () => {
    expect(
      getDisplayTotalCents({
        quote,
        items: [
          { id: 'burger', quantity: 99 },
          { id: 'fries', quantity: 99 },
        ],
        quoteMismatch: false,
        quoteStale: false,
      }),
    ).toBe(1700);
  });

  it('uses validated prices with current quantities when the quote is mismatched', () => {
    expect(
      getDisplayTotalCents({
        quote,
        items: [
          { id: 'burger', quantity: 2 },
          { id: 'fries', quantity: 3 },
        ],
        quoteMismatch: true,
        quoteStale: false,
      }),
    ).toBe(3900);
  });

  it('uses validated prices with current quantities when the quote is stale', () => {
    expect(
      getDisplayTotalCents({
        quote,
        items: [{ id: 'burger', quantity: 2 }],
        quoteMismatch: false,
        quoteStale: true,
      }),
    ).toBe(2400);
  });

  it('returns zero without a quote', () => {
    expect(
      getDisplayTotalCents({
        quote: null,
        items: [{ id: 'burger', quantity: 2 }],
        quoteMismatch: false,
        quoteStale: false,
      }),
    ).toBe(0);
  });
});

describe('calculateQuantityAdjustedTotalCents', () => {
  it('uses current cart quantities with validated prices', () => {
    expect(
      calculateQuantityAdjustedTotalCents(quote, [
        { id: 'burger', quantity: 2 },
        { id: 'fries', quantity: 3 },
      ]),
    ).toBe(3900);
  });

  it('ignores quoted menu items that are no longer in the cart', () => {
    expect(
      calculateQuantityAdjustedTotalCents(quote, [
        { id: 'burger', quantity: 1 },
      ]),
    ).toBe(1200);
  });

  it('returns zero without a quote', () => {
    expect(
      calculateQuantityAdjustedTotalCents(null, [
        { id: 'burger', quantity: 2 },
      ]),
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
