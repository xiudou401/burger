import { SignJWT, errors, jwtVerify } from 'jose';
import { env } from '../config/env';
import type { AuthTokenPayload } from '../types/auth';
import { ServiceError } from '../errors/ServiceError';
import { TTL_SECONDS } from '../config/ttl';

const JWT_ALGORITHM = 'HS256';
const JWT_TYPE = 'JWT';

const getJwtSecret = () => new TextEncoder().encode(env.JWT_SECRET);

const isTokenPayload = (payload: unknown): payload is AuthTokenPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as {
    sub?: unknown;
    exp?: unknown;
    iat?: unknown;
    email?: unknown;
    phone?: unknown;
  };

  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.exp === 'number' &&
    typeof candidate.iat === 'number' &&
    (candidate.email === undefined || typeof candidate.email === 'string') &&
    (candidate.phone === undefined || typeof candidate.phone === 'string')
  );
};

export const signAuthToken = async (
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: JWT_TYPE })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS.ACCESS_TOKEN}s`)
    .sign(getJwtSecret());
};

export const verifyAuthToken = async (
  token: string,
): Promise<AuthTokenPayload> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
      typ: JWT_TYPE,
    });

    if (!isTokenPayload(payload)) {
      throw new ServiceError('Invalid token', 401);
    }

    return payload;
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    if (error instanceof errors.JWTExpired) {
      throw new ServiceError('Token expired', 401);
    }

    throw new ServiceError('Invalid token', 401);
  }
};
