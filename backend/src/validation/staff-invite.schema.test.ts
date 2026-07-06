import {
  AcceptStaffInviteSchema,
  CreateStaffInviteSchema,
} from './staff-invite.schema';

describe('staff invite schemas', () => {
  test('normalizes invite emails at the request boundary', () => {
    expect(
      CreateStaffInviteSchema.parse({
        email: ' STAFF@example.com ',
        role: 'staff',
      }),
    ).toEqual({
      email: 'staff@example.com',
      role: 'staff',
    });
  });

  test('rejects admin invites', () => {
    expect(() =>
      CreateStaffInviteSchema.parse({
        email: 'admin@example.com',
        role: 'admin',
      }),
    ).toThrow();
  });

  test('trims invite tokens at the request boundary', () => {
    expect(AcceptStaffInviteSchema.parse({ token: ' invite-token ' })).toEqual({
      token: 'invite-token',
    });
  });
});
