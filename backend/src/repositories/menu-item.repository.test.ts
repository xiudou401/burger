import { MealModel } from '../models/meal.model';
import { menuItemRepository } from './menu-item.repository';

jest.mock('../models/meal.model', () => ({
  MealModel: {
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

    jest.mocked(MealModel.find).mockReturnValue({ sort } as never);

    await expect(
      menuItemRepository.findPage({
        query,
        sort: sortOption,
        skip: 8,
        limit: 4,
      }),
    ).resolves.toEqual([]);

    expect(MealModel.find).toHaveBeenCalledWith(query);
    expect(sort).toHaveBeenCalledWith(sortOption);
    expect(skip).toHaveBeenCalledWith(8);
    expect(limit).toHaveBeenCalledWith(4);
  });

  test('finds cart menu items by ids', async () => {
    const lean = jest.fn().mockResolvedValue([]);

    jest.mocked(MealModel.find).mockReturnValue({ lean } as never);

    await menuItemRepository.findByIds(['meal-1', 'meal-2']);

    expect(MealModel.find).toHaveBeenCalledWith({
      _id: { $in: ['meal-1', 'meal-2'] },
    });
    expect(lean).toHaveBeenCalled();
  });

  test('updates menu items with validation enabled', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest.mocked(MealModel.findByIdAndUpdate).mockReturnValue({ exec } as never);

    await menuItemRepository.updateById('meal-1', {
      name: 'Burger',
      description: 'Nice',
      priceCents: 1200,
      image: '/img/burger.png',
      category: 'burger',
      isAvailable: true,
      isFeatured: false,
    });

    expect(MealModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'meal-1',
      {
        name: 'Burger',
        description: 'Nice',
        priceCents: 1200,
        image: '/img/burger.png',
        category: 'burger',
        isAvailable: true,
        isFeatured: false,
      },
      { new: true, runValidators: true },
    );
    expect(exec).toHaveBeenCalled();
  });
});
