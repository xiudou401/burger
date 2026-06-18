import { pbkdf2Sync } from 'crypto';
import {
  hashPassword,
  passwordHashNeedsUpgrade,
  verifyPassword,
} from './password';

const makeLegacyHash = (password: string) => {
  const iterations = 120_000;
  const salt = 'legacy-salt';
  const hash = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString(
    'hex',
  );

  return `${iterations}:${salt}:${hash}`;
};

test('hashes and verifies passwords asynchronously', async () => {
  const hash = await hashPassword('Burger#2026');

  await expect(verifyPassword('Burger#2026', hash)).resolves.toBe(true);
  await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
});

test('rejects malformed password hashes', async () => {
  await expect(verifyPassword('Burger#2026', 'invalid-hash')).resolves.toBe(
    false,
  );
});

test('detects legacy password hashes that need an iteration upgrade', async () => {
  const currentHash = await hashPassword('Burger#2026');
  const legacyHash = makeLegacyHash('Burger#2026');

  expect(passwordHashNeedsUpgrade(currentHash)).toBe(false);
  expect(passwordHashNeedsUpgrade(legacyHash)).toBe(true);
  await expect(verifyPassword('Burger#2026', legacyHash)).resolves.toBe(true);
});
