import { ServiceError } from '../errors/ServiceError';
import { createHmac } from 'crypto';

process.env.MONGO_URI =
  process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
const TEST_JWT_SECRET = 'test-secret-for-jest-at-least-32-chars';
process.env.JWT_SECRET = TEST_JWT_SECRET;

const { signAuthToken, verifyAuthToken } =
  require('./token') as typeof import('./token');

const toBase64Url = (value: string | Buffer) =>
  Buffer.from(value).toString('base64url');

const signTestToken = (header: unknown, payload: unknown) => {
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = toBase64Url(
    createHmac('sha256', TEST_JWT_SECRET).update(unsignedToken).digest(),
  );

  return `${unsignedToken}.${signature}`;
};

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

test('rejects tokens with unsupported headers', () => {
  const token = signTestToken(
    { alg: 'none', typ: 'JWT' },
    {
      sub: 'user-123',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    },
  );

  expect(() => verifyAuthToken(token)).toThrow(ServiceError);
});

test('treats tokens as expired at the exp second', () => {
  const now = Math.floor(Date.now() / 1000);
  const token = signTestToken(
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: 'user-123',
      iat: now - 60,
      exp: now,
    },
  );

  expect(() => verifyAuthToken(token)).toThrow(ServiceError);
});
