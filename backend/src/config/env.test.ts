import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';

const ORIGINAL_ENV = process.env;

const baseEnv = {
  MONGO_URI: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'test-secret-for-jest-at-least-32-chars',
  FRONTEND_URL: 'http://localhost:3000',
};

const loadEnv = () => {
  let loadedEnv: typeof import('./env').env | undefined;

  jest.isolateModules(() => {
    loadedEnv = jest.requireActual<typeof import('./env')>('./env').env;
  });

  return loadedEnv;
};

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    ...baseEnv,
    NODE_ENV: 'test',
    RESEND_API_KEY: '',
    EMAIL_FROM: '',
  };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

test('allows missing email configuration outside production', () => {
  const env = loadEnv();

  expect(env?.NODE_ENV).toBe('test');
  expect(env?.RESEND_API_KEY).toBeUndefined();
  expect(env?.EMAIL_FROM).toBeUndefined();
});

test('rejects missing production email configuration', () => {
  process.env.NODE_ENV = 'production';
  process.env.RESEND_API_KEY = '';
  process.env.EMAIL_FROM = '';

  expect(loadEnv).toThrow('Production email configuration is missing');
});

test('allows production when email configuration is present', () => {
  process.env.NODE_ENV = 'production';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.EMAIL_FROM = 'Burger Club <orders@example.com>';

  const env = loadEnv();

  expect(env?.NODE_ENV).toBe('production');
  expect(env?.RESEND_API_KEY).toBe('re_test_key');
  expect(env?.EMAIL_FROM).toBe('Burger Club <orders@example.com>');
});
