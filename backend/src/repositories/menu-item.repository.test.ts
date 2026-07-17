import { MenuItemModel } from '../models/menu-item.model';
import { menuItemRepository } from './menu-item.repository';

jest.mock('../models/menu-item.model', () => ({
  MenuItemModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

describe('menuItemRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('finds paginated menu items with filters and sorting', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    const query = { priceCents: { $gte: 10 } };
    const sortOption = { priceCents: 1 as const };

    jest.mocked(MenuItemModel.find).mockReturnValue({ sort } as never);

    await expect(
      menuItemRepository.findPage({
        query,
        sort: sortOption,
        skip: 8,
        limit: 4,
      }),
    ).resolves.toEqual([]);

    expect(MenuItemModel.find).toHaveBeenCalledWith(query);
    expect(sort).toHaveBeenCalledWith(sortOption);
    expect(skip).toHaveBeenCalledWith(8);
    expect(limit).toHaveBeenCalledWith(4);
  });

  test('finds cart menu items by ids', async () => {
    const lean = jest.fn().mockResolvedValue([]);

    jest.mocked(MenuItemModel.find).mockReturnValue({ lean } as never);

    await menuItemRepository.findByIds(['menu-item-1', 'menu-item-2']);

    expect(MenuItemModel.find).toHaveBeenCalledWith({
      _id: { $in: ['menu-item-1', 'menu-item-2'] },
    });
    expect(lean).toHaveBeenCalled();
  });

  test('updates menu items with validation enabled', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest
      .mocked(MenuItemModel.findByIdAndUpdate)
      .mockReturnValue({ exec } as never);

    await menuItemRepository.updateById('menu-item-1', {
      name: 'Burger',
      description: 'Nice',
      priceCents: 1200,
      image: '/img/burger.png',
      category: 'burger',
      isAvailable: true,
    });

    expect(MenuItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'menu-item-1',
      {
        name: 'Burger',
        description: 'Nice',
        priceCents: 1200,
        image: '/img/burger.png',
        category: 'burger',
        isAvailable: true,
      },
      { new: true, runValidators: true },
    );
    expect(exec).toHaveBeenCalled();
  });
});
