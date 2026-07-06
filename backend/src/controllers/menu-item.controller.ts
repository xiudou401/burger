import { NextFunction, Request, Response } from 'express';
import {
  createMenuItem,
  deleteMenuItem,
  findAllMenuItems,
  updateMenuItem,
} from '../services/menu-item.service';
import type {
  MenuItemParamsPayload,
  MenuItemPayload,
  MenuItemQueryPayload,
} from '../validation/menu-item.schema';

export const getMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query as unknown as MenuItemQueryPayload;

    const menuItems = await findAllMenuItems(query);

    res.status(200).json(menuItems);
  } catch (error) {
    next(error);
  }
};

export const createMenuItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body as MenuItemPayload;
    const menuItem = await createMenuItem(payload);

    res.status(201).json({ menuItem });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { menuItemId } = req.params as MenuItemParamsPayload;
    const payload = req.body as MenuItemPayload;
    const menuItem = await updateMenuItem(menuItemId, payload);

    res.status(200).json({ menuItem });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { menuItemId } = req.params as MenuItemParamsPayload;
    const menuItem = await deleteMenuItem(menuItemId);

    res.status(200).json({ menuItem });
  } catch (error) {
    next(error);
  }
};
