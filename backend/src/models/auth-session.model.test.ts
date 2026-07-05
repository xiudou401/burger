import { AuthSessionModel } from './auth-session.model';

test('declares a TTL index for expired auth sessions', () => {
  expect(AuthSessionModel.schema.indexes()).toContainEqual([
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  ]);
});

test('keeps refresh token hashes hidden and uniquely indexed', () => {
  expect(AuthSessionModel.schema.path('refreshTokenHash').options.select).toBe(
    false,
  );
  expect(AuthSessionModel.schema.indexes()).toContainEqual([
    { refreshTokenHash: 1 },
    { unique: true },
  ]);
});

test('indexes active sessions by token family', () => {
  expect(AuthSessionModel.schema.indexes()).toContainEqual([
    { familyId: 1, revokedAt: 1, expiresAt: 1 },
    {},
  ]);
});
