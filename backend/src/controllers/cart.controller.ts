import { NextFunction, Request, Response } from 'express';
import { validateCart } from '../services/cart.service';
import type { CartPayload } from '../validation/cart.schema';

export const validateCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { items, menuVersion } = req.body as CartPayload;

    const result = await validateCart(items, menuVersion);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
