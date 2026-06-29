import { MealModel } from '../models/meal.model';
import { mealRepository } from './meal.repository';

jest.mock('../models/meal.model', () => ({
  MealModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

describe('mealRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('finds paginated meals with filters and sorting', async () => {
    const lean = jest.fn().mockResolvedValue([]);
    const limit = jest.fn().mockReturnValue({ lean });
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    const query = { priceCents: { $gte: 10 } };
    const sortOption = { priceCents: 1 as const };

    jest.mocked(MealModel.find).mockReturnValue({ sort } as never);

    await expect(
      mealRepository.findPage({
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

  test('finds cart meals by ids', async () => {
    const lean = jest.fn().mockResolvedValue([]);

    jest.mocked(MealModel.find).mockReturnValue({ lean } as never);

    await mealRepository.findByIds(['meal-1', 'meal-2']);

    expect(MealModel.find).toHaveBeenCalledWith({
      _id: { $in: ['meal-1', 'meal-2'] },
    });
    expect(lean).toHaveBeenCalled();
  });

  test('updates meals with validation enabled', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest.mocked(MealModel.findByIdAndUpdate).mockReturnValue({ exec } as never);

    await mealRepository.updateById('meal-1', {
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
