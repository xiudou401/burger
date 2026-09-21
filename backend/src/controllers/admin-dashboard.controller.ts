import { NextFunction, Request, Response } from 'express';
import {
  getAdminAnalyticsSummary,
  getAdminDashboardSummary,
} from '../services/admin-dashboard.service';
import { detectAnalyticsAlerts } from '../services/admin-alert.service';
import type { AdminAnalyticsQueryPayload } from '../validation/admin-dashboard.schema';

export const getAdminDashboardSummaryHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const summary = await getAdminDashboardSummary();

    return res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalyticsSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { range } = req.query as unknown as AdminAnalyticsQueryPayload;
    const analytics = await getAdminAnalyticsSummary(range);

    return res.status(200).json({ analytics });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalyticsAlertsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { range } = req.query as unknown as AdminAnalyticsQueryPayload;
    const alerts = await detectAnalyticsAlerts(range);

    return res.status(200).json({ alerts });
  } catch (error) {
    next(error);
  }
};
