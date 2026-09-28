import type { Request } from 'express';
import type { AuthSessionMetadata } from '../services/auth-session.service';

export const getSessionMetadata = (req: Request): AuthSessionMetadata => ({
  ipAddress: req.ip,
  userAgent: typeof req.get === 'function' ? req.get('user-agent') : undefined,
  lastUsedAt: new Date(),
});
