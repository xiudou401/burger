import { ServiceError } from '../errors/ServiceError';

process.env.MONGO_URI =
  process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret-for-jest-at-least-32-chars';

const { signAuthToken, verifyAuthToken } =
  require('./token') as typeof import('./token');

test('signs and verifies access tokens', () => {
  const token = signAuthToken({
    sub: 'user-123',
    email: 'pat@example.com',
    phone: '+61412345678',
  });

  const payload = verifyAuthToken(token);

  expect(payload.sub).toBe('user-123');
  expect(payload.email).toBe('pat@example.com');
  expect(payload.phone).toBe('+61412345678');
  expect(typeof payload.iat).toBe('number');
  expect(typeof payload.exp).toBe('number');
  expect(payload.exp).toBeGreaterThan(payload.iat);
});

test('rejects tampered access tokens', () => {
  const token = signAuthToken({ sub: 'user-123' });
  const parts = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({
      sub: 'attacker',
      exp: Math.floor(Date.now() / 1000) + 60,
    }),
  ).toString('base64url');

  expect(() =>
    verifyAuthToken(`${parts[0]}.${tamperedPayload}.${parts[2]}`),
  ).toThrow(ServiceError);
});

test('rejects malformed access tokens', () => {
  expect(() => verifyAuthToken('not-a-jwt')).toThrow(ServiceError);
});
