import { NextFunction, Request, Response } from 'express';
import { validateCart, CartStoredItem } from '../services/cart.service';

const isValidCartItem = (item: unknown): item is CartStoredItem => {
  if (!item || typeof item !== 'object') return false;

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.quantity === 'number' &&
    Number.isInteger(candidate.quantity) &&
    candidate.quantity > 0
  );
};

export const validateCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const items = req.body?.items;
    const menuVersion = req.body?.menuVersion;

    if (!Array.isArray(items) || !items.every(isValidCartItem)) {
      return res.status(400).json({
        message: 'Invalid cart items',
      });
    }

    if (typeof menuVersion !== 'number' || !Number.isInteger(menuVersion)) {
      return res.status(400).json({
        message: 'Invalid menu version',
      });
    }

    const result = await validateCart(items, menuVersion);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
