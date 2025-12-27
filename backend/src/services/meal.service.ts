import { AppError } from '../errors/AppError';
import Meal from '../model/meal.model';

interface MealQuery {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

type SortOption = 'price_asc' | 'price_desc' | 'created_asc' | 'created_desc';

const SORT_MAP: Record<SortOption, any> = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  created_asc: { createdAt: 1 },
  created_desc: { createdAt: -1 },
};

export const findAllMeals = async (query: MealQuery = {}) => {
  try {
    const { keyword, minPrice, maxPrice, page = 1, limit = 8, sort } = query;
    const sortOption = sort ? SORT_MAP[sort] : { createdAt: -1 };
    const mongoQuery: any = {};

    if (keyword) {
      mongoQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      mongoQuery.price = {};
      if (minPrice !== undefined) mongoQuery.price.$gte = minPrice;
      if (maxPrice !== undefined) mongoQuery.price.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Meal.find(mongoQuery).sort(sortOption).skip(skip).limit(limit).lean(),
      Meal.countDocuments(mongoQuery),
    ]);

    return {
      items: items.map((meal) => ({
        id: meal._id.toString(),
        name: meal.name,
        description: meal.description,
        price: meal.price,
        image: meal.image,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('分页查询菜品失败：', error);
    throw new AppError('获取菜品数据失败，请稍后重试', 500);
  }
};
