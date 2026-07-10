import { toPublicUser } from './public-user';

test('maps a user document to its public authenticated shape', () => {
  expect(
    toPublicUser({
      _id: 'user-123',
      email: 'pat@example.com',
      name: 'Pat',
      emailVerified: true,
      phoneVerified: false,
    }),
  ).toEqual({
    id: 'user-123',
    email: 'pat@example.com',
    name: 'Pat',
    role: 'customer',
    status: 'active',
    emailVerified: true,
    phone: undefined,
    phoneVerified: false,
  });
});
