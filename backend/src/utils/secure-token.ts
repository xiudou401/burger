import { createHash, randomBytes } from 'crypto';

export const createSecureToken = () => {
  return randomBytes(32).toString('hex');
};

export const hashToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex');
};
