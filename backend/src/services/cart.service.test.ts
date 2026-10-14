import { menuItemRepository } from '../repositories/menu-item.repository';
import { getMenuVersion } from './menu.service';
import { validateCart } from './cart.service';
import { Types } from 'mongoose';

jest.mock('./menu.service', () => ({
  getMenuVersion: jest.fn(),
}));

jest.mock('../repositories/menu-item.repository', () => ({
  menuItemRepository: {
    findByIds: jest.fn(),
  },
}));

describe('cart service validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('includes the missing menu item id when a cart item was removed', async () => {
    const itemId = '64f1b2c3d4e5f67890123456';

    jest.mocked(getMenuVersion).mockResolvedValue(7);
    jest.mocked(menuItemRepository.findByIds).mockResolvedValue([]);

    await expect(
      validateCart([{ id: itemId, quantity: 1 }], 7),
    ).rejects.toMatchObject({
      message: 'Some cart items are no longer available',
      statusCode: 400,
      details: {
        code: 'CART_ITEMS_INVALID',
        items: [{ itemId, reason: 'removed' }],
      },
    });
  });

  test('collects multiple invalid cart items before rejecting', async () => {
    const removedItemId = '64f1b2c3d4e5f67890123456';
    const soldOutItemId = '64f1b2c3d4e5f67890123457';

    jest.mocked(getMenuVersion).mockResolvedValue(7);
    jest.mocked(menuItemRepository.findByIds).mockResolvedValue([
      {
        _id: new Types.ObjectId(soldOutItemId),
        name: 'Cold Soft Drink',
        image: '/img/drink.png',
        priceCents: 390,
        category: 'drink',
        isAvailable: false,
      } as Awaited<ReturnType<typeof menuItemRepository.findByIds>>[number],
    ]);

    await expect(
      validateCart(
        [
          { id: removedItemId, quantity: 1 },
          { id: soldOutItemId, quantity: 2 },
        ],
        7,
      ),
    ).rejects.toMatchObject({
      message: 'Some cart items are no longer available',
      statusCode: 400,
      details: {
        code: 'CART_ITEMS_INVALID',
        items: [
          {
            itemId: removedItemId,
            reason: 'removed',
          },
          {
            itemId: soldOutItemId,
            reason: 'sold_out',
            name: 'Cold Soft Drink',
          },
        ],
      },
    });
  });
});
