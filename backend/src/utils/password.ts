import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST,
  ).toString('hex');

  return `${ITERATIONS}:${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [iterations, salt, hash] = storedHash.split(':');

  if (!iterations || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(
    password,
    salt,
    Number(iterations),
    KEY_LENGTH,
    DIGEST,
  );
  const expected = Buffer.from(hash, 'hex');

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
};
