import { auditLogRepository } from '../repositories/audit-log.repository';
import type { AuditLogCreateInput } from '../repositories/audit-log.repository';

export interface PublicAuditLog {
  id: string;
  actorId: string;
  actorRole: AuditLogCreateInput['actorRole'];
  action: AuditLogCreateInput['action'];
  entityType: AuditLogCreateInput['entityType'];
  entityId: string;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
}

const toPublicAuditLog = (auditLog: {
  _id: unknown;
  actorId: unknown;
  actorRole: AuditLogCreateInput['actorRole'];
  action: AuditLogCreateInput['action'];
  entityType: AuditLogCreateInput['entityType'];
  entityId: string;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
}): PublicAuditLog => ({
  id: String(auditLog._id),
  actorId: String(auditLog.actorId),
  actorRole: auditLog.actorRole,
  action: auditLog.action,
  entityType: auditLog.entityType,
  entityId: auditLog.entityId,
  before: auditLog.before,
  after: auditLog.after,
  createdAt: auditLog.createdAt,
});

export const recordAuditLog = async (input: AuditLogCreateInput) => {
  try {
    await auditLogRepository.create(input);
  } catch (error) {
    console.error('Audit log write failed', error);
  }
};

export const listAuditLogs = async (limit = 50) => {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const auditLogs = await auditLogRepository.listRecent(safeLimit);

  return auditLogs.map(toPublicAuditLog);
};
