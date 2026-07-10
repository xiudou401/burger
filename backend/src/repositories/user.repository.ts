import { UserModel } from '../models/user.model';
import type { SortOrder } from 'mongoose';

export const userRepository = {
  existsByEmail(email: string) {
    return UserModel.exists({ email });
  },

  create(data: Parameters<typeof UserModel.create>[0]) {
    return UserModel.create(data);
  },

  findById(userId: string) {
    return UserModel.findById(userId).exec();
  },

  findLeanById(userId: string) {
    return UserModel.findById(userId).lean().exec();
  },

  findByEmail(email: string) {
    return UserModel.findOne({ email }).exec();
  },

  findByEmailWithPassword(email: string) {
    return UserModel.findOne({ email }).select('+passwordHash').exec();
  },

  findByPhone(phone: string) {
    return UserModel.findOne({ phone }).exec();
  },

  findByValidEmailVerificationToken(tokenHash: string, now = new Date()) {
    return UserModel.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: now },
    })
      .select('+emailVerificationTokenHash +emailVerificationExpiresAt')
      .exec();
  },

  findByValidPasswordResetToken(tokenHash: string, now = new Date()) {
    return UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: now },
    })
      .select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt')
      .exec();
  },

  findByValidSmsCode(phone: string, codeHash: string, now = new Date()) {
    return UserModel.findOne({
      phone,
      smsVerificationCodeHash: codeHash,
      smsVerificationExpiresAt: { $gt: now },
    })
      .select('+smsVerificationCodeHash +smsVerificationExpiresAt')
      .exec();
  },

  findCustomersPage({
    query,
    sort,
    skip,
    limit,
  }: {
    query: Record<string, unknown>;
    sort: Record<string, SortOrder>;
    skip: number;
    limit: number;
  }) {
    return UserModel.find(query).sort(sort).skip(skip).limit(limit).exec();
  },

  count(query: Record<string, unknown>) {
    return UserModel.countDocuments(query).exec();
  },

  setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return UserModel.findByIdAndUpdate(userId, {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    }).exec();
  },

  save<T extends { save: () => Promise<unknown> }>(user: T) {
    return user.save();
  },
};
