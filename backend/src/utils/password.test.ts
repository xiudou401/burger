import { hashPassword, verifyPassword } from './password';

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
