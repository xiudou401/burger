import { NextFunction, Request, Response } from 'express';
import { getAdminDashboardSummary } from '../services/admin-dashboard.service';

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
