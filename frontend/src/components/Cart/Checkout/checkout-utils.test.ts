import { calculateTotals } from './checkout-utils';

describe('calculateTotals', () => {
  test('calculates total quantity and price from cart meals', () => {
    expect(
      calculateTotals([
        {
          id: 'meal-1',
          name: 'Classic Burger',
          description: 'Beef burger',
          price: 12,
          quantity: 2,
          subtotal: 24,
          image: '/img/burger.png',
        },
        {
          id: 'meal-2',
          name: 'Fries',
          description: 'Crispy fries',
          price: 5,
          quantity: 3,
          subtotal: 15,
          image: '/img/fries.png',
        },
      ]),
    ).toEqual({
      totalQuantity: 5,
      totalPrice: 39,
    });
  });

  test('returns zero totals for an empty cart', () => {
    expect(calculateTotals([])).toEqual({
      totalQuantity: 0,
      totalPrice: 0,
    });
  });
});
