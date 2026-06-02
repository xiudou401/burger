import { Types } from 'mongoose';
import { AuthSessionModel } from '../models/auth-session.model';

export const authSessionRepository = {
  create(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }) {
    return AuthSessionModel.create({
      ...data,
      userId: new Types.ObjectId(data.userId),
    });
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

  revokeActiveByUserId(userId: string) {
    return AuthSessionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        revokedAt: { $exists: false },
      },
      { revokedAt: new Date() },
    ).exec();
  },

  save<T extends { save: () => Promise<unknown> }>(session: T) {
    return session.save();
  },
};
