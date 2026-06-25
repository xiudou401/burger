import { model, Schema, Types } from 'mongoose';

export interface AuthSession {
  userId: Types.ObjectId;
  familyId?: string;
  parentSessionId?: Types.ObjectId;
  replacedBySessionId?: Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  rotatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<AuthSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      index: true,
    },
    parentSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AuthSession',
    },
    replacedBySessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AuthSession',
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    rotatedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
authSessionSchema.index({ familyId: 1, revokedAt: 1, expiresAt: 1 });

export const AuthSessionModel = model<AuthSession>(
  'AuthSession',
  authSessionSchema,
);
