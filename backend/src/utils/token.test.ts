import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceError } from '../errors/ServiceError';

process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret';

const { signAuthToken, verifyAuthToken } = require('./token') as typeof import('./token');

test('signs and verifies access tokens', () => {
  const token = signAuthToken({
    sub: 'user-123',
    email: 'pat@example.com',
    phone: '+61412345678',
  });

  const payload = verifyAuthToken(token);

  assert.equal(payload.sub, 'user-123');
  assert.equal(payload.email, 'pat@example.com');
  assert.equal(payload.phone, '+61412345678');
  assert.equal(typeof payload.iat, 'number');
  assert.equal(typeof payload.exp, 'number');
  assert.ok(payload.exp > payload.iat);
});

test('rejects tampered access tokens', () => {
  const token = signAuthToken({ sub: 'user-123' });
  const parts = token.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ sub: 'attacker', exp: Math.floor(Date.now() / 1000) + 60 }),
  ).toString('base64url');

  assert.throws(
    () => verifyAuthToken(`${parts[0]}.${tamperedPayload}.${parts[2]}`),
    ServiceError,
  );
});

test('rejects malformed access tokens', () => {
  assert.throws(() => verifyAuthToken('not-a-jwt'), ServiceError);
});
