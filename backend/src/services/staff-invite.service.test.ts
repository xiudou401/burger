import { ServiceError } from '../errors/ServiceError';
import { staffInviteRepository } from '../repositories/staff-invite.repository';
import { userRepository } from '../repositories/user.repository';
import { createAuthSession } from './auth-session.service';
import { acceptStaffInvite } from './staff-invite.service';

jest.mock('../repositories/staff-invite.repository', () => ({
  staffInviteRepository: {
    claimPendingByTokenHashForEmail: jest.fn(),
    findPendingByTokenHash: jest.fn(),
    restoreAcceptedInvite: jest.fn(),
  },
}));

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
    acceptStaffInviteRole: jest.fn(),
  },
}));

jest.mock('./auth-session.service', () => ({
  createAuthSession: jest.fn(),
}));

describe('staff invite service', () => {
  const userId = '507f1f77bcf86cd799439011';
  const inviteId = '507f1f77bcf86cd799439012';
  const now = new Date('2026-01-01T00:00:00.000Z');
  const baseUser = {
    _id: userId,
    email: 'Pat@Example.com',
    name: 'Pat',
    role: 'customer' as const,
    status: 'active' as const,
    emailVerified: false,
    phoneVerified: false,
  };
  const acceptedInvite = {
    _id: inviteId,
    email: 'pat@example.com',
    role: 'staff' as const,
    status: 'accepted' as const,
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    acceptedAt: now,
    createdAt: now,
  };
  const staffUser = {
    ...baseUser,
    email: 'pat@example.com',
    role: 'staff' as const,
    emailVerified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(staffInviteRepository.findPendingByTokenHash)
      .mockResolvedValue(null);
    jest
      .mocked(staffInviteRepository.restoreAcceptedInvite)
      .mockResolvedValue(null);
    jest.mocked(createAuthSession).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: userId,
        email: 'pat@example.com',
        name: 'Pat',
        role: 'staff',
        permissions: ['view_orders', 'update_order_status'],
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
      },
    });
  });

  test('atomically claims a pending invite before promoting the user', async () => {
    jest.mocked(userRepository.findById).mockResolvedValue(baseUser as never);
    jest
      .mocked(staffInviteRepository.claimPendingByTokenHashForEmail)
      .mockResolvedValue(acceptedInvite as never);
    jest
      .mocked(userRepository.acceptStaffInviteRole)
      .mockResolvedValue(staffUser as never);

    const result = await acceptStaffInvite({
      token: 'invite-token',
      userId,
    });

    expect(
      staffInviteRepository.claimPendingByTokenHashForEmail,
    ).toHaveBeenCalledWith(expect.any(String), 'pat@example.com');
    expect(userRepository.acceptStaffInviteRole).toHaveBeenCalledWith(
      userId,
      'staff',
    );
    expect(createAuthSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: userId,
        role: 'staff',
        emailVerified: true,
      }),
    );
    expect(result.invite.status).toBe('accepted');
    expect(result.user.role).toBe('staff');
  });

  test('rejects already claimed or expired invites without promoting the user', async () => {
    jest.mocked(userRepository.findById).mockResolvedValue(baseUser as never);
    jest
      .mocked(staffInviteRepository.claimPendingByTokenHashForEmail)
      .mockResolvedValue(null);

    await expect(
      acceptStaffInvite({ token: 'invite-token', userId }),
    ).rejects.toThrow('Invite link is invalid or expired');

    expect(userRepository.acceptStaffInviteRole).not.toHaveBeenCalled();
    expect(createAuthSession).not.toHaveBeenCalled();
  });

  test('does not claim invites for the wrong signed-in email', async () => {
    jest.mocked(userRepository.findById).mockResolvedValue(baseUser as never);
    jest
      .mocked(staffInviteRepository.claimPendingByTokenHashForEmail)
      .mockResolvedValue(null);
    jest
      .mocked(staffInviteRepository.findPendingByTokenHash)
      .mockResolvedValue({
        ...acceptedInvite,
        status: 'pending',
        email: 'another@example.com',
      } as never);

    await expect(
      acceptStaffInvite({ token: 'invite-token', userId }),
    ).rejects.toMatchObject({
      message: 'This invite belongs to another email',
      statusCode: 403,
    });

    expect(userRepository.acceptStaffInviteRole).not.toHaveBeenCalled();
    expect(createAuthSession).not.toHaveBeenCalled();
  });

  test('restores a claimed invite if user promotion fails', async () => {
    const error = new Error('User save failed');
    jest.mocked(userRepository.findById).mockResolvedValue(baseUser as never);
    jest
      .mocked(staffInviteRepository.claimPendingByTokenHashForEmail)
      .mockResolvedValue(acceptedInvite as never);
    jest.mocked(userRepository.acceptStaffInviteRole).mockRejectedValue(error);

    await expect(
      acceptStaffInvite({ token: 'invite-token', userId }),
    ).rejects.toBe(error);

    expect(staffInviteRepository.restoreAcceptedInvite).toHaveBeenCalledWith(
      inviteId,
    );
    expect(createAuthSession).not.toHaveBeenCalled();
  });

  test('rejects users without the invited email before claiming', async () => {
    jest.mocked(userRepository.findById).mockResolvedValue({
      ...baseUser,
      email: undefined,
    } as never);

    await expect(
      acceptStaffInvite({ token: 'invite-token', userId }),
    ).rejects.toThrow(ServiceError);

    expect(
      staffInviteRepository.claimPendingByTokenHashForEmail,
    ).not.toHaveBeenCalled();
  });
});
