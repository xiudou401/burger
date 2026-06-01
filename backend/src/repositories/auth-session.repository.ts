import { Types } from 'mongoose';
import { AuthSessionModel } from '../models/auth-session.model';

export const authSessionRepository = {
  create(data: {
    userId: Types.ObjectId;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    return AuthSessionModel.create(data);
  },

  findByRefreshTokenHash(refreshTokenHash: string) {
    return AuthSessionModel.findOne({ refreshTokenHash })
      .select('+refreshTokenHash')
      .exec();
  },

  revokeByRefreshTokenHash(refreshTokenHash: string) {
    return AuthSessionModel.findOneAndUpdate(
      {
        refreshTokenHash,
        revokedAt: { $exists: false },
      },
      { revokedAt: new Date() },
    ).exec();
  },

  revokeActiveByUserId(userId: Types.ObjectId) {
    return AuthSessionModel.updateMany(
      {
        userId,
        revokedAt: { $exists: false },
      },
      { revokedAt: new Date() },
    ).exec();
  },

  save<T extends { save: () => Promise<unknown> }>(session: T) {
    return session.save();
  },
};
