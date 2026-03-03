import { NextFunction, Request, Response } from 'express';
import { validateCart } from '../services/cart.service';
import { getMenuVersion } from '../services/menu.service';

export const validateCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const items = req.body?.items;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid cart items' });
    }

    const [validatedMeals, menuVersion] = await Promise.all([
      validateCart(items),
      getMenuVersion(),
    ]);

    res.status(200).json({
      menuVersion,
      items: validatedMeals,
    });
  } catch (error) {
    next(error);
  }
};
