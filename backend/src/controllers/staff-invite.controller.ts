import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import {
  acceptStaffInvite,
  createStaffInvite,
  listStaffInvites,
  revokeStaffInvite,
} from '../services/staff-invite.service';

const getString = (value: unknown) => {
  return typeof value === 'string' ? value : '';
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
    const invite = await createStaffInvite({
      email: getString(req.body?.email),
      role: getString(req.body?.role),
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
    const invite = await revokeStaffInvite(req.params.inviteId);

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
    const result = await acceptStaffInvite({
      token: getString(req.body?.token),
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
