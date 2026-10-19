import { loadCartState } from './cart-reducer';
import { MAX_CART_ITEM_QUANTITY } from './cart-logic';

const setCartStorage = () => {
  localStorage.setItem(
    'CartItemsState',
    JSON.stringify([{ id: 'meal-1', quantity: 2 }]),
  );
};

describe('loadCartState', () => {
  afterEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  test('loads persisted cart items during normal navigation', () => {
    setCartStorage();
    window.history.pushState({}, '', '/');

    expect(loadCartState()).toEqual({
      items: [{ id: 'meal-1', quantity: 2 }],
      totalQuantity: 2,
    });
  });

  test('ignores invalid persisted cart items and normalizes quantities', () => {
    localStorage.setItem(
      'CartItemsState',
      JSON.stringify([
        { id: 'meal-1', quantity: 2.9 },
        { id: 'meal-4', quantity: MAX_CART_ITEM_QUANTITY + 5 },
        { id: 'meal-2', quantity: '3' },
        { id: 'meal-3', quantity: 0 },
        { id: 4, quantity: 1 },
        null,
      ]),
    );

    expect(loadCartState()).toEqual({
      items: [
        { id: 'meal-1', quantity: 2 },
        { id: 'meal-4', quantity: MAX_CART_ITEM_QUANTITY },
      ],
      totalQuantity: 2 + MAX_CART_ITEM_QUANTITY,
    });
  });

  test('preserves cart until payment is verified on the payment return route', () => {
    setCartStorage();
    window.history.pushState(
      {},
      '',
      '/payment/return?payment=success&orderId=order-1',
    );

    expect(loadCartState().items).toEqual([{ id: 'meal-1', quantity: 2 }]);
    expect(JSON.parse(localStorage.getItem('CartItemsState')!)).toEqual([
      { id: 'meal-1', quantity: 2 },
    ]);
  });

  test('does not trust success query parameters on the legacy route', () => {
    setCartStorage();
    window.history.pushState(
      {},
      '',
      '/profile?payment=success&orderId=order-1',
    );

    expect(loadCartState().items).toEqual([{ id: 'meal-1', quantity: 2 }]);
  });
});
