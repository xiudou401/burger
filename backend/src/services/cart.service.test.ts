import { menuItemRepository } from '../repositories/menu-item.repository';
import { MAX_CART_ITEM_QUANTITY } from '../validation/cart.schema';
import { getMenuVersion } from './menu.service';
import { validateCart } from './cart.service';

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

  test('rejects invalid cart payloads before reading menu data', async () => {
    await expect(
      validateCart(
        [{ id: 'not-an-object-id', quantity: MAX_CART_ITEM_QUANTITY + 1 }],
        -1,
      ),
    ).rejects.toMatchObject({
      message: 'Invalid cart payload',
      statusCode: 400,
    });

    expect(getMenuVersion).not.toHaveBeenCalled();
    expect(menuItemRepository.findByIds).not.toHaveBeenCalled();
  });

  test('includes the missing menu item id when a cart item was removed', async () => {
    const itemId = '64f1b2c3d4e5f67890123456';

    jest.mocked(getMenuVersion).mockResolvedValue(7);
    jest.mocked(menuItemRepository.findByIds).mockResolvedValue([]);

    await expect(
      validateCart([{ id: itemId, quantity: 1 }], 7),
    ).rejects.toMatchObject({
      message: 'Menu item removed',
      statusCode: 400,
      details: { itemId },
    });
  });
});
