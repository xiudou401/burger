import { NextFunction, Request, Response } from 'express';
import {
  disableCustomer,
  enableCustomer,
  listCustomers,
} from '../services/admin-customer.service';
import type { AdminCustomerQuery } from '../validation/admin-customer.schema';

export const listCustomersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await listCustomers(
      req.query as unknown as AdminCustomerQuery,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const disableCustomerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customer = await disableCustomer(req.params.customerId, req.body);

    res.json({ customer });
  } catch (error) {
    next(error);
  }
};

export const enableCustomerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const customer = await enableCustomer(req.params.customerId);

    res.json({ customer });
  } catch (error) {
    next(error);
  }
};
