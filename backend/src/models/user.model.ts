import { model, Schema } from 'mongoose';

export interface User {
  name: string;
  email?: string;
  passwordHash?: string;
  role: 'customer' | 'admin' | 'staff';
  status: 'active' | 'disabled';
  disabledAt?: Date;
  disabledReason?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  smsVerificationCodeHash?: string;
  smsVerificationExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      required: true,
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      required: true,
      default: 'active',
      index: true,
    },
    disabledAt: {
      type: Date,
    },
    disabledReason: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    phoneVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },
    smsVerificationCodeHash: {
      type: String,
      select: false,
    },
    smsVerificationExpiresAt: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

export const UserModel = model<User>('User', userSchema);
