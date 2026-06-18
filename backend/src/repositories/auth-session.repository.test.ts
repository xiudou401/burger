import { Types } from 'mongoose';
import { AuthSessionModel } from '../models/auth-session.model';
import { authSessionRepository } from './auth-session.repository';

jest.mock('../models/auth-session.model', () => ({
  AuthSessionModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
  },
}));

describe('authSessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('finds sessions by refresh token hash with hidden hash selected', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ exec });

    jest.mocked(AuthSessionModel.findOne).mockReturnValue({ select } as never);

    await authSessionRepository.findByRefreshTokenHash('hash');

    expect(AuthSessionModel.findOne).toHaveBeenCalledWith({
      refreshTokenHash: 'hash',
    });
    expect(select).toHaveBeenCalledWith('+refreshTokenHash');
    expect(exec).toHaveBeenCalled();
  });

  test('atomically consumes an active refresh session', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ exec });
    const now = new Date('2026-06-18T00:00:00.000Z');

    jest
      .mocked(AuthSessionModel.findOneAndUpdate)
      .mockReturnValue({ select } as never);

    await authSessionRepository.consumeActiveByRefreshTokenHash('hash', now);

    expect(AuthSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        refreshTokenHash: 'hash',
        revokedAt: { $exists: false },
        rotatedAt: { $exists: false },
        expiresAt: { $gt: now },
      },
      {
        revokedAt: now,
        rotatedAt: now,
      },
      { new: true },
    );
    expect(select).toHaveBeenCalledWith('+refreshTokenHash');
    expect(exec).toHaveBeenCalled();
  });

  test('revokes active sessions by refresh token hash', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest
      .mocked(AuthSessionModel.findOneAndUpdate)
      .mockReturnValue({ exec } as never);

    await authSessionRepository.revokeByRefreshTokenHash('hash');

    expect(AuthSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        refreshTokenHash: 'hash',
        revokedAt: { $exists: false },
      },
      { revokedAt: expect.any(Date) },
    );
  });

  test('revokes all active sessions for a user', async () => {
    const userId = new Types.ObjectId().toString();
    const exec = jest.fn().mockResolvedValue(null);

    jest.mocked(AuthSessionModel.updateMany).mockReturnValue({ exec } as never);

    await authSessionRepository.revokeActiveByUserId(userId);

    expect(AuthSessionModel.updateMany).toHaveBeenCalledWith(
      {
        userId: expect.any(Types.ObjectId),
        revokedAt: { $exists: false },
      },
      { revokedAt: expect.any(Date) },
    );
  });
});
