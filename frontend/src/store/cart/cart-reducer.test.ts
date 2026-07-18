import { initialCartState, loadCartState } from './cart-reducer';

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
        { id: 'meal-2', quantity: '3' },
        { id: 'meal-3', quantity: 0 },
        { id: 4, quantity: 1 },
        null,
      ]),
    );

    expect(loadCartState()).toEqual({
      items: [{ id: 'meal-1', quantity: 2 }],
      totalQuantity: 2,
    });
  });

  test('clears persisted cart on the new payment return route', () => {
    setCartStorage();
    window.history.pushState(
      {},
      '',
      '/payment/return?payment=success&orderId=order-1',
    );

    expect(loadCartState()).toEqual(initialCartState);
    expect(localStorage.getItem('CartItemsState')).toBe('[]');
  });

  test('clears persisted cart on the legacy profile success route', () => {
    setCartStorage();
    window.history.pushState(
      {},
      '',
      '/profile?payment=success&orderId=order-1',
    );

    expect(loadCartState()).toEqual(initialCartState);
    expect(localStorage.getItem('CartItemsState')).toBe('[]');
  });
});
