import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';

const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

const getStoredIterations = (storedHash: string) => {
  const [iterations] = storedHash.split(':');
  const parsedIterations = Number(iterations);

  return Number.isFinite(parsedIterations) ? parsedIterations : null;
};

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
  const parsedIterations = getStoredIterations(storedHash);

  if (!parsedIterations || !iterations || !salt || !hash) {
    return false;
  }

  const candidate = await derivePasswordKey(password, salt, parsedIterations);
  const expected = Buffer.from(hash, 'hex');

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
};

export const passwordHashNeedsUpgrade = (storedHash: string) => {
  const iterations = getStoredIterations(storedHash);

  return iterations === null || iterations < ITERATIONS;
};
