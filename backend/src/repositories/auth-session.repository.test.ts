import { Types } from 'mongoose';
import { AuthSessionModel } from '../models/auth-session.model';
import { authSessionRepository } from './auth-session.repository';

jest.mock('../models/auth-session.model', () => ({
  AuthSessionModel: {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
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

  test('links a replacement session to a consumed session', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest
      .mocked(AuthSessionModel.findByIdAndUpdate)
      .mockReturnValue({ exec } as never);

    await authSessionRepository.linkReplacement(
      new Types.ObjectId().toString(),
      'family-1',
      new Types.ObjectId().toString(),
    );

    expect(AuthSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      {
        familyId: 'family-1',
        replacedBySessionId: expect.any(Types.ObjectId),
      },
      { new: true },
    );
  });

  test('restores a consumed session without a linked replacement', async () => {
    const sessionId = new Types.ObjectId().toString();
    const exec = jest.fn().mockResolvedValue(null);

    jest
      .mocked(AuthSessionModel.findOneAndUpdate)
      .mockReturnValue({ exec } as never);

    await authSessionRepository.restoreConsumedById(sessionId);

    expect(AuthSessionModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: expect.any(Types.ObjectId),
        replacedBySessionId: { $exists: false },
      },
      {
        $unset: {
          revokedAt: '',
          rotatedAt: '',
          replacedBySessionId: '',
        },
      },
    );
  });

  test('revokes a session by id', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest
      .mocked(AuthSessionModel.findByIdAndUpdate)
      .mockReturnValue({ exec } as never);

    await authSessionRepository.revokeById(new Types.ObjectId().toString());

    expect(AuthSessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
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

  test('revokes all active sessions in a token family', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest.mocked(AuthSessionModel.updateMany).mockReturnValue({ exec } as never);

    await authSessionRepository.revokeActiveByFamilyId('family-1');

    expect(AuthSessionModel.updateMany).toHaveBeenCalledWith(
      {
        familyId: 'family-1',
        revokedAt: { $exists: false },
      },
      { revokedAt: expect.any(Date) },
    );
  });
});
