import { model, Schema, Types } from 'mongoose';

export type StaffInviteRole = 'staff';
export type StaffInviteStatus = 'pending' | 'accepted' | 'revoked';

export interface StaffInvite {
  email: string;
  role: StaffInviteRole;
  tokenHash: string;
  invitedBy: Types.ObjectId;
  status: StaffInviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const staffInviteSchema = new Schema<StaffInvite>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['staff'],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      required: true,
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: Date,
  },
  { timestamps: true },
);

staffInviteSchema.index({ email: 1, status: 1, createdAt: -1 });

export const StaffInviteModel = model<StaffInvite>(
  'StaffInvite',
  staffInviteSchema,
);
