import { menuItemRepository } from '../repositories/menu-item.repository';
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

  test('includes the missing menu item id when a cart item was removed', async () => {
    const itemId = '64f1b2c3d4e5f67890123456';

    jest.mocked(getMenuVersion).mockResolvedValue(7);
    jest.mocked(menuItemRepository.findByIds).mockResolvedValue([]);

    await expect(
      validateCart([{ id: itemId, quantity: 1 }], 7),
    ).rejects.toMatchObject({
      message: `Menu item ${itemId} is no longer available`,
      statusCode: 400,
      details: {
        code: 'MENU_ITEM_REMOVED',
        itemId,
      },
    });
  });
});
