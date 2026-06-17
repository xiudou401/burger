import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

const derivePasswordKey = (
  password: string,
  salt: string,
  iterations: number,
) =>
  new Promise<Buffer>((resolve, reject) => {
    pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hash = await derivePasswordKey(password, salt, ITERATIONS);

  return `${ITERATIONS}:${salt}:${hash.toString('hex')}`;
};

export const verifyPassword = async (password: string, storedHash: string) => {
  const [iterations, salt, hash] = storedHash.split(':');

  if (!iterations || !salt || !hash) {
    return false;
  }

  const candidate = await derivePasswordKey(password, salt, Number(iterations));
  const expected = Buffer.from(hash, 'hex');

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
};
