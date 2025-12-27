import { NextFunction, Request, Response } from 'express';
import { findAllMeals, SortOption } from '../services/meal.service';

const isSortOption = (value: any): value is SortOption => {
  return ['price_asc', 'price_desc', 'created_asc', 'created_desc'].includes(
    value
  );
};

const toNumber = (value: any): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export const getMeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { keyword, minPrice, maxPrice, page, limit, sort } = req.query;

    const meals = await findAllMeals({
      keyword: typeof keyword === 'string' ? keyword : undefined,
      minPrice: toNumber(minPrice),
      maxPrice: toNumber(maxPrice),
      page: toNumber(page) ?? 1,
      limit: toNumber(limit) ?? 8,
      sort: isSortOption(sort) ? sort : undefined,
    });

    res.status(200).json(meals);
  } catch (error) {
    next(error);
  }
};
