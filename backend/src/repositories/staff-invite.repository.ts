import { Types } from 'mongoose';
import {
  StaffInviteModel,
  type StaffInviteRole,
} from '../models/staff-invite.model';
import { ServiceError } from '../errors/ServiceError';

const isObjectId = (id: string) => Types.ObjectId.isValid(id);

export const staffInviteRepository = {
  revokePendingByEmail(email: string) {
    return StaffInviteModel.updateMany(
      { email, status: 'pending' },
      { $set: { status: 'revoked' } },
    ).exec();
  },

  create(data: {
    email: string;
    role: StaffInviteRole;
    tokenHash: string;
    invitedBy: string;
    status: 'pending';
    expiresAt: Date;
  }) {
    if (!isObjectId(data.invitedBy)) {
      throw new ServiceError('Invalid inviter', 400);
    }

    return StaffInviteModel.create({
      ...data,
      invitedBy: new Types.ObjectId(data.invitedBy),
    });
  },

  listRecent(limit: number) {
    return StaffInviteModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  },

  findById(inviteId: string) {
    if (!isObjectId(inviteId)) {
      return Promise.resolve(null);
    }

    return StaffInviteModel.findById(inviteId).exec();
  },

  findPendingByTokenHash(tokenHash: string, now = new Date()) {
    return StaffInviteModel.findOne({
      tokenHash,
      status: 'pending',
      expiresAt: { $gt: now },
    })
      .select('+tokenHash')
      .exec();
  },

  claimPendingByTokenHashForEmail(
    tokenHash: string,
    email: string,
    acceptedAt = new Date(),
  ) {
    return StaffInviteModel.findOneAndUpdate(
      {
        tokenHash,
        email,
        status: 'pending',
        expiresAt: { $gt: acceptedAt },
      },
      {
        $set: {
          status: 'accepted',
          acceptedAt,
        },
      },
      {
        new: true,
      },
    )
      .select('+tokenHash')
      .exec();
  },

  restoreAcceptedInvite(inviteId: string) {
    if (!isObjectId(inviteId)) {
      return Promise.resolve(null);
    }

    return StaffInviteModel.findOneAndUpdate(
      {
        _id: inviteId,
        status: 'accepted',
      },
      {
        $set: {
          status: 'pending',
        },
        $unset: {
          acceptedAt: 1,
        },
      },
      {
        new: true,
      },
    ).exec();
  },

  save<T extends { save: () => Promise<unknown> }>(invite: T) {
    return invite.save();
  },
};
