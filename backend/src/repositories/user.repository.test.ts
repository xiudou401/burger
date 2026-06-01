import { UserModel } from '../models/user.model';
import { userRepository } from './user.repository';

jest.mock('../models/user.model', () => ({
  UserModel: {
    exists: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe('userRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('finds a user by email with password selected', async () => {
    const user = { _id: 'user-1', passwordHash: 'hash' };
    const exec = jest.fn().mockResolvedValue(user);
    const select = jest.fn().mockReturnValue({ exec });

    jest.mocked(UserModel.findOne).mockReturnValue({ select } as never);

    await expect(
      userRepository.findByEmailWithPassword('pat@example.com'),
    ).resolves.toBe(user);

    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: 'pat@example.com',
    });
    expect(select).toHaveBeenCalledWith('+passwordHash');
    expect(exec).toHaveBeenCalled();
  });

  test('finds valid password reset tokens with hidden fields selected', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ exec });

    jest.mocked(UserModel.findOne).mockReturnValue({ select } as never);

    await userRepository.findByValidPasswordResetToken('token-hash');

    expect(UserModel.findOne).toHaveBeenCalledWith({
      passwordResetTokenHash: 'token-hash',
      passwordResetExpiresAt: { $gt: expect.any(Date) },
    });
    expect(select).toHaveBeenCalledWith(
      '+passwordHash +passwordResetTokenHash +passwordResetExpiresAt',
    );
  });

  test('updates email verification token by id', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const expiresAt = new Date('2026-01-01T00:00:00.000Z');

    jest.mocked(UserModel.findByIdAndUpdate).mockReturnValue({ exec } as never);

    await userRepository.setEmailVerificationToken(
      'user-1',
      'token-hash',
      expiresAt,
    );

    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('user-1', {
      emailVerificationTokenHash: 'token-hash',
      emailVerificationExpiresAt: expiresAt,
    });
    expect(exec).toHaveBeenCalled();
  });
});
