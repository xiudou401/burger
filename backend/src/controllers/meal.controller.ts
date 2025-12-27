import { NextFunction, Request, Response } from 'express';
import { findAllMeals } from '../services/meal.service';

const getMeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { keyword, minPrice, maxPrice, page = '1', limit = '8' } = req.query;
    const meals = await findAllMeals({
      keyword: keyword as string | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: Number(page),
      limit: Number(limit),
    });
    res.status(200).json(meals);
  } catch (error) {
    next(error);
  }
};

export { getMeals };
