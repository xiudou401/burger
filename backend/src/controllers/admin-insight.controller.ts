import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import {
  generateAdminInsights,
  investigateAdminAlert,
} from '../services/admin-insight.service';
import type {
  AdminAlertInvestigationRequestPayload,
  AdminInsightRequestPayload,
} from '../validation/admin-insight.schema';

export const generateAdminInsightsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const payload = req.body as AdminInsightRequestPayload;
    const result = await generateAdminInsights(payload, req.user);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const investigateAdminAlertHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const payload = req.body as AdminAlertInvestigationRequestPayload;
    const result = await investigateAdminAlert(payload, req.user);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
