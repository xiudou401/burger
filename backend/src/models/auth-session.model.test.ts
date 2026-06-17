import { AuthSessionModel } from './auth-session.model';

test('declares a TTL index for expired auth sessions', () => {
  expect(AuthSessionModel.schema.indexes()).toContainEqual([
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
  ]);
});
