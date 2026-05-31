import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import {
  createOrder,
  getOrderById,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from '../services/order.service';
import type {
  CreateOrderPayload,
  UpdateOrderStatusPayload,
} from '../validation/order.schema';

export const createOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const { items, menuVersion } = req.body as CreateOrderPayload;

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
    const { status } = req.body as UpdateOrderStatusPayload;

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
