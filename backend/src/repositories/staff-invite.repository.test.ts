import { StaffInviteModel } from '../models/staff-invite.model';
import { staffInviteRepository } from './staff-invite.repository';

jest.mock('../models/staff-invite.model', () => ({
  StaffInviteModel: {
    findOneAndUpdate: jest.fn(),
  },
}));

describe('staffInviteRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('atomically claims pending invites for the signed-in email', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ exec });
    const acceptedAt = new Date('2026-01-01T00:00:00.000Z');

    jest
      .mocked(StaffInviteModel.findOneAndUpdate)
      .mockReturnValue({ select } as never);

    await staffInviteRepository.claimPendingByTokenHashForEmail(
      'token-hash',
      'pat@example.com',
      acceptedAt,
    );

    expect(StaffInviteModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        tokenHash: 'token-hash',
        email: 'pat@example.com',
        status: 'pending',
        expiresAt: { $gt: acceptedAt },
      },
      {
        $set: {
          status: 'accepted',
          acceptedAt,
        },
      },
      {
        new: true,
      },
    );
    expect(select).toHaveBeenCalledWith('+tokenHash');
    expect(exec).toHaveBeenCalled();
  });

  test('restores accepted invites when promotion fails', async () => {
    const exec = jest.fn().mockResolvedValue(null);

    jest
      .mocked(StaffInviteModel.findOneAndUpdate)
      .mockReturnValue({ exec } as never);

    await staffInviteRepository.restoreAcceptedInvite(
      '507f1f77bcf86cd799439012',
    );

    expect(StaffInviteModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: '507f1f77bcf86cd799439012',
        status: 'accepted',
      },
      {
        $set: {
          status: 'pending',
        },
        $unset: {
          acceptedAt: 1,
        },
      },
      {
        new: true,
      },
    );
    expect(exec).toHaveBeenCalled();
  });
});
