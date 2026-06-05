import { calculateTotals } from './checkout-utils';

describe('calculateTotals', () => {
  test('calculates quantity and total cents from cart meals', () => {
    expect(
      calculateTotals([
        {
          id: 'meal-1',
          name: 'Classic Burger',
          description: 'Beef burger',
          priceCents: 1200,
          quantity: 2,
          subtotalCents: 2400,
          image: '/img/burger.png',
        },
        {
          id: 'meal-2',
          name: 'Fries',
          description: 'Crispy fries',
          priceCents: 500,
          quantity: 3,
          subtotalCents: 1500,
          image: '/img/fries.png',
        },
      ]),
    ).toEqual({
      totalQuantity: 5,
      totalCents: 3900,
    });
  });

  test('returns zero totals for an empty cart', () => {
    expect(calculateTotals([])).toEqual({
      totalQuantity: 0,
      totalCents: 0,
    });
  });
});
