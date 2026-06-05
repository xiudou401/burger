import { AppError } from '../errors/AppError';
import { ServiceError } from '../errors/ServiceError';

import type { SortOrder } from 'mongoose';
import { getMenuVersion } from './menu.service';
import { mealRepository } from '../repositories/meal.repository';

interface MealQuery {
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: SortOption;
}

interface MealPayload {
  name: string;
  description?: string;
  price: number;
  image?: string;
}

export type SortOption =
  | 'price_asc'
  | 'price_desc'
  | 'created_asc'
  | 'created_desc';

const SORT_MAP: Record<SortOption, Record<string, SortOrder>> = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  created_asc: { createdAt: 1 },
  created_desc: { createdAt: -1 },
};

export const findAllMeals = async (query: MealQuery = {}) => {
  try {
    const { keyword, minPrice, maxPrice, page = 1, limit = 8, sort } = query;

    const sortOption: Record<string, SortOrder> = sort
      ? SORT_MAP[sort]
      : { createdAt: -1 };

    const mongoQuery: Record<string, any> = {};

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
        price: meal.price,
        image: meal.image,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Meal pagination failed:', error);
    throw new AppError('Could not load menu items. Please try again later.', 500);
  }
};

const normalizeMealPayload = (payload: Partial<MealPayload>): MealPayload => {
  const name = payload.name?.trim() ?? '';
  const description = payload.description?.trim();
  const image = payload.image?.trim();
  const price = Number(payload.price);

  if (!name) {
    throw new ServiceError('Meal name is required', 400);
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new ServiceError('Meal price must be a positive number', 400);
  }

  return {
    name,
    description,
    price,
    image,
  };
};

const toPublicMeal = (meal: {
  _id: unknown;
  name: string;
  description?: string;
  price: number;
  image?: string;
}) => ({
  id: String(meal._id),
  name: meal.name,
  description: meal.description,
  price: meal.price,
  image: meal.image,
});

export const createMeal = async (payload: Partial<MealPayload>) => {
  const meal = await mealRepository.create(normalizeMealPayload(payload));

  return toPublicMeal(meal);
};

export const updateMeal = async (
  mealId: string,
  payload: Partial<MealPayload>,
) => {
  const meal = await mealRepository.updateById(
    mealId,
    normalizeMealPayload(payload),
  );

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
