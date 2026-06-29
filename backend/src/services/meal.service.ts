import { AppError } from '../errors/AppError';
import { ServiceError } from '../errors/ServiceError';

import type { SortOrder } from 'mongoose';
import { getMenuVersion } from './menu.service';
import { mealRepository } from '../repositories/meal.repository';
import type { MealPayload } from '../validation/meal.schema';

interface MealQuery {
  keyword?: string;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

export type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'created_asc'
  | 'created_desc';

const SORT_MAP: Record<SortOption, Record<string, SortOrder>> = {
  price_asc: { priceCents: 1 },
  price_desc: { priceCents: -1 },
  created_asc: { createdAt: 1 },
  created_desc: { createdAt: -1 },
};

export const findAllMeals = async (query: MealQuery = {}) => {
  try {
    const {
      keyword,
      category,
      minPriceCents,
      maxPriceCents,
      page = 1,
      limit = 8,
      sort,
    } = query;

    const sortOption: Record<string, SortOrder> = sort
      ? SORT_MAP[sort]
      : { createdAt: -1 };

    const mongoQuery: Record<string, any> = {};

    if (category) {
      mongoQuery.category = category;
    }

    if (keyword) {
      mongoQuery.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (minPriceCents !== undefined || maxPriceCents !== undefined) {
      mongoQuery.priceCents = {};
      if (minPriceCents !== undefined) {
        mongoQuery.priceCents.$gte = minPriceCents;
      }
      if (maxPriceCents !== undefined) {
        mongoQuery.priceCents.$lte = maxPriceCents;
      }
    }

    const skip = (page - 1) * limit;

    const [items, total, menuVersion] = await Promise.all([
      mealRepository.findPage({
        query: mongoQuery,
        sort: sortOption,
        skip,
        limit,
      }),
      mealRepository.count(mongoQuery),
      getMenuVersion(),
    ]);

    return {
      menuVersion,
      items: items.map((meal) => ({
        id: meal._id.toString(),
        name: meal.name,
        description: meal.description,
        priceCents: meal.priceCents,
        image: meal.image,
        category: meal.category ?? 'burger',
        isAvailable: meal.isAvailable ?? true,
        isFeatured: meal.isFeatured ?? false,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Meal pagination failed:', error);
    throw new AppError(
      'Could not load menu items. Please try again later.',
      500,
    );
  }
};

const toPublicMeal = (meal: {
  _id: unknown;
  name: string;
  description?: string;
  priceCents: number;
  image?: string;
  category?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
}) => ({
  id: String(meal._id),
  name: meal.name,
  description: meal.description,
  priceCents: meal.priceCents,
  image: meal.image,
  category: meal.category ?? 'burger',
  isAvailable: meal.isAvailable ?? true,
  isFeatured: meal.isFeatured ?? false,
});

export const createMeal = async (payload: MealPayload) => {
  const meal = await mealRepository.create(payload);

  return toPublicMeal(meal);
};

export const updateMeal = async (mealId: string, payload: MealPayload) => {
  const meal = await mealRepository.updateById(mealId, payload);

  if (!meal) {
    throw new ServiceError('Meal not found', 404);
  }

  return toPublicMeal(meal);
};

export const deleteMeal = async (mealId: string) => {
  const meal = await mealRepository.deleteById(mealId);

  if (!meal) {
    throw new ServiceError('Meal not found', 404);
  }

  return toPublicMeal(meal);
};
