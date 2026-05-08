import { Request, Response, NextFunction } from 'express';
import { getMenuVersion } from '../services/menu.service';

export const findMenuVersion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const menuVersion = await getMenuVersion();

    res.status(200).json({ menuVersion });
  } catch (error) {
    next(error);
  }
};
