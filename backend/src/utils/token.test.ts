import { SignJWT, UnsecuredJWT } from 'jose';
import { ServiceError } from '../errors/ServiceError';

process.env.MONGO_URI =
  process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
const TEST_JWT_SECRET = 'test-secret-for-jest-at-least-32-chars';
process.env.JWT_SECRET = TEST_JWT_SECRET;

const { signAuthToken, verifyAuthToken } =
  require('./token') as typeof import('./token');

const getJwtSecret = () => new TextEncoder().encode(TEST_JWT_SECRET);

test('signs and verifies access tokens', async () => {
  const token = await signAuthToken({
    sub: 'user-123',
    email: 'pat@example.com',
    phone: '+61412345678',
  });

  const payload = await verifyAuthToken(token);

  expect(payload.sub).toBe('user-123');
  expect(payload.email).toBe('pat@example.com');
  expect(payload.phone).toBe('+61412345678');
  expect(typeof payload.iat).toBe('number');
  expect(typeof payload.exp).toBe('number');
  expect(payload.exp).toBeGreaterThan(payload.iat);
});

test('rejects tampered access tokens', async () => {
  const token = await signAuthToken({ sub: 'user-123' });
  const parts = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({
      sub: 'attacker',
      exp: Math.floor(Date.now() / 1000) + 60,
    }),
  ).toString('base64url');

  await expect(
    verifyAuthToken(`${parts[0]}.${tamperedPayload}.${parts[2]}`),
  ).rejects.toThrow(ServiceError);
});

test('rejects malformed access tokens', async () => {
  await expect(verifyAuthToken('not-a-jwt')).rejects.toThrow(ServiceError);
});

test('rejects tokens with unsupported headers', async () => {
  const token = new UnsecuredJWT({
    sub: 'user-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  })
    .setIssuedAt()
    .encode();

  await expect(verifyAuthToken(token)).rejects.toThrow(ServiceError);
});

test('treats tokens as expired at the exp second', async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ sub: 'user-123' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now - 60)
    .setExpirationTime(now)
    .sign(getJwtSecret());

  await expect(verifyAuthToken(token)).rejects.toMatchObject({
    message: 'Token expired',
    statusCode: 401,
  });
});
