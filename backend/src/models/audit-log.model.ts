import { model, Schema, Types } from 'mongoose';
import type { UserRole } from '../types/permissions';

export const AUDIT_ACTIONS = [
  'order.status_changed',
  'menu_item.created',
  'menu_item.updated',
  'menu_item.deleted',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditEntityType = 'order' | 'menu_item';

export interface AuditLog {
  actorId: Types.ObjectId;
  actorRole: UserRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: unknown;
  after?: unknown;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      required: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['order', 'menu_item'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLogModel = model<AuditLog>('AuditLog', auditLogSchema);
