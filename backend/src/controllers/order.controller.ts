import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import {
  createCheckoutOrder,
  createOrder,
  getOrderById,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from '../services/order.service';
import type {
  CreateOrderPayload,
  ListOrdersQueryPayload,
  OrderParamsPayload,
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

export const createCheckoutOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const { items, menuVersion } = req.body as CreateOrderPayload;

    const checkout = await createCheckoutOrder(req.user.id, items, menuVersion);

    return res.status(201).json(checkout);
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
    const { limit } = req.query as unknown as ListOrdersQueryPayload;
    const orders = await listOrdersForUser(req.user.id, limit);

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
    const { orderId } = req.params as OrderParamsPayload;
    const order = await getOrderForUser(req.user.id, orderId);

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
    const { limit } = req.query as unknown as ListOrdersQueryPayload;
    const orders = await listAllOrders(limit);

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
    const { orderId } = req.params as OrderParamsPayload;

    const order = await updateOrderStatus(orderId, status);

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
    const { orderId } = req.params as OrderParamsPayload;
    const order = await getOrderById(orderId);

    return res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};
