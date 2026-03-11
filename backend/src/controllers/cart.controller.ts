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
    const clientMenuVersion = req.body?.menuVersion ?? 0;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid cart items' });
    }

    const result = await validateCart(items, clientMenuVersion);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
