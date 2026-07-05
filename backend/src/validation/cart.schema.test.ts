import {
  CartPayloadSchema,
  MAX_CART_ITEM_QUANTITY,
  MAX_CART_ITEMS,
} from './cart.schema';

const menuItemId = '507f1f77bcf86cd799439011';

describe('cart payload schema', () => {
  test('accepts a bounded cart payload with ObjectId item ids', () => {
    expect(
      CartPayloadSchema.safeParse({
        items: [{ id: menuItemId, quantity: MAX_CART_ITEM_QUANTITY }],
        menuVersion: 0,
      }).success,
    ).toBe(true);
  });

  test('rejects invalid item ids', () => {
    expect(
      CartPayloadSchema.safeParse({
        items: [{ id: 'not-an-object-id', quantity: 1 }],
        menuVersion: 0,
      }).success,
    ).toBe(false);
  });

  test('rejects empty or oversized carts', () => {
    expect(
      CartPayloadSchema.safeParse({
        items: [],
        menuVersion: 0,
      }).success,
    ).toBe(false);

    expect(
      CartPayloadSchema.safeParse({
        items: Array.from({ length: MAX_CART_ITEMS + 1 }, (_, index) => ({
          id: index.toString(16).padStart(24, '0'),
          quantity: 1,
        })),
        menuVersion: 0,
      }).success,
    ).toBe(false);
  });

  test('rejects invalid quantities and menu versions', () => {
    expect(
      CartPayloadSchema.safeParse({
        items: [{ id: menuItemId, quantity: MAX_CART_ITEM_QUANTITY + 1 }],
        menuVersion: 0,
      }).success,
    ).toBe(false);

    expect(
      CartPayloadSchema.safeParse({
        items: [{ id: menuItemId, quantity: 1 }],
        menuVersion: -1,
      }).success,
    ).toBe(false);
  });
});
