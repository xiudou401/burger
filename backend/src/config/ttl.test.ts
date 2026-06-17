import { TTL_MS, TTL_SECONDS } from './ttl';

test('defines authentication TTLs using the expected units', () => {
  expect(TTL_SECONDS.ACCESS_TOKEN).toBe(15 * 60);
  expect(TTL_MS.SMS_CODE).toBe(5 * 60 * 1000);
  expect(TTL_MS.PASSWORD_RESET).toBe(30 * 60 * 1000);
  expect(TTL_MS.EMAIL_VERIFICATION).toBe(24 * 60 * 60 * 1000);
  expect(TTL_MS.STAFF_INVITE).toBe(7 * 24 * 60 * 60 * 1000);
  expect(TTL_MS.REFRESH_SESSION).toBe(30 * 24 * 60 * 60 * 1000);
  expect(TTL_MS.REFRESH_COOKIE_SKEW).toBe(5 * 1000);
  expect(TTL_MS.REFRESH_COOKIE_MAX_AGE).toBe(
    TTL_MS.REFRESH_SESSION - TTL_MS.REFRESH_COOKIE_SKEW,
  );
});
