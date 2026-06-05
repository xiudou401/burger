import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import { REFRESH_SESSION_TTL_MS } from '../services/auth-session.service';
import {
  acceptStaffInvite,
  createStaffInvite,
  listStaffInvites,
  revokeStaffInvite,
} from '../services/staff-invite.service';
import type {
  AcceptStaffInvitePayload,
  CreateStaffInvitePayload,
  StaffInviteParamsPayload,
} from '../validation/staff-invite.schema';

const REFRESH_COOKIE_NAME = 'refreshToken';

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_SESSION_TTL_MS,
  });
};

export const createStaffInviteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const { email, role } = req.body as CreateStaffInvitePayload;
    const invite = await createStaffInvite({
      email,
      role,
      invitedBy: req.user.id,
    });

    return res.status(201).json({ invite });
  } catch (error) {
    next(error);
  }
};

export const listStaffInvitesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const invites = await listStaffInvites();

    return res.status(200).json({ invites });
  } catch (error) {
    next(error);
  }
};

export const revokeStaffInviteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { inviteId } = req.params as StaffInviteParamsPayload;
    const invite = await revokeStaffInvite(inviteId);

    return res.status(200).json({ invite });
  } catch (error) {
    next(error);
  }
};

export const acceptStaffInviteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const { token } = req.body as AcceptStaffInvitePayload;
    const result = await acceptStaffInvite({
      token,
      userId: req.user.id,
    });
    setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _refreshToken, ...body } = result;

    return res.status(200).json(body);
  } catch (error) {
    next(error);
  }
};
