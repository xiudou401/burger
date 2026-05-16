import { NextFunction, Request, Response } from 'express';
import {
  CartStoredItem,
} from '../services/cart.service';
import { ServiceError } from '../errors/ServiceError';
import {
  createOrder,
  getOrderById,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from '../services/order.service';

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

export const createOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

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

    const order = await createOrder(req.user.id, items, menuVersion);

    return res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

export const listMyOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const rawLimit = Number(req.query.limit ?? 5);
    const orders = await listOrdersForUser(req.user.id, rawLimit);

    return res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const order = await getOrderForUser(req.user.id, req.params.orderId);

    return res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

export const listAdminOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawLimit = Number(req.query.limit ?? 25);
    const orders = await listAllOrders(rawLimit);

    return res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.body?.status;

    if (typeof status !== 'string') {
      return res.status(400).json({
        message: 'Invalid order status',
      });
    }

    const order = await updateOrderStatus(req.params.orderId, status);

    return res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await getOrderById(req.params.orderId);

    return res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};
