import { Types } from 'mongoose';
import {
  AuditLogModel,
  type AuditAction,
  type AuditEntityType,
} from '../models/audit-log.model';
import type { UserRole } from '../types/permissions';

export interface AuditLogCreateInput {
  actorId: string;
  actorRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

export const auditLogRepository = {
  create(data: AuditLogCreateInput) {
    return AuditLogModel.create({
      ...data,
      actorId: new Types.ObjectId(data.actorId),
    });
  },

  listRecent(limit: number) {
    return AuditLogModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  },
};
