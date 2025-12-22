import { Request, Response } from 'express';
import Meal from '../model/Meal.model';

const getMeals = async (req: Request, res: Response) => {
  const meals = await Meal.find();
  res.status(200).json(meals);
};

export { getMeals };
