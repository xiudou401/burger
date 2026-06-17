import { model, Schema, Types } from 'mongoose';

export interface AuthSession {
  userId: Types.ObjectId;
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

export const AuthSessionModel = model<AuthSession>(
  'AuthSession',
  authSessionSchema,
);
