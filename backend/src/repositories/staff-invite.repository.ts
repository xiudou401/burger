import { Types } from 'mongoose';
import {
  StaffInviteModel,
  type StaffInviteRole,
} from '../models/staff-invite.model';

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
    invitedBy: Types.ObjectId;
    status: 'pending';
    expiresAt: Date;
  }) {
    return StaffInviteModel.create(data);
  },

  listRecent(limit: number) {
    return StaffInviteModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  },

  findById(inviteId: string) {
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

  save<T extends { save: () => Promise<unknown> }>(invite: T) {
    return invite.save();
  },
};
