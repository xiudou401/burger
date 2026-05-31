import { NextFunction, Request, Response } from 'express';
import {
  createMeal,
  deleteMeal,
  findAllMeals,
  updateMeal,
} from '../services/meal.service';
import type {
  MealParamsPayload,
  MealPayload,
  MealQueryPayload,
} from '../validation/meal.schema';

export const getMeals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query as unknown as MealQueryPayload;

    const meals = await findAllMeals(query);

    res.status(200).json(meals);
  } catch (error) {
    next(error);
  }
};

export const createMealHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body as MealPayload;
    const meal = await createMeal(payload);

    res.status(201).json({ meal });
  } catch (error) {
    next(error);
  }
};

export const updateMealHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mealId } = req.params as MealParamsPayload;
    const payload = req.body as MealPayload;
    const meal = await updateMeal(mealId, payload);

    res.status(200).json({ meal });
  } catch (error) {
    next(error);
  }
};

export const deleteMealHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mealId } = req.params as MealParamsPayload;
    const meal = await deleteMeal(mealId);

    res.status(200).json({ meal });
  } catch (error) {
    next(error);
  }
};
