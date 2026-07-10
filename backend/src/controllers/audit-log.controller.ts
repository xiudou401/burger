import { NextFunction, Request, Response } from 'express';
import { listAuditLogs } from '../services/audit-log.service';
import type { ListAuditLogsQueryPayload } from '../validation/audit-log.schema';

export const listAuditLogsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { limit } = req.query as unknown as ListAuditLogsQueryPayload;
    const auditLogs = await listAuditLogs(limit);

    return res.status(200).json({ auditLogs });
  } catch (error) {
    next(error);
  }
};
